-- Migration to create the secure backend scoring RPC

CREATE OR REPLACE FUNCTION submit_quiz_attempt(
    p_quiz_id UUID,
    p_answers JSONB -- format: {"question_id_string": selected_index_integer_or_null}
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to read correct answers bypassing strict RLS
AS $$
DECLARE
    v_user_id UUID;
    v_score INTEGER := 0;
    v_total_questions INTEGER := 0;
    v_enriched_answers JSONB := '{}'::jsonb;
    v_question RECORD;
    v_selected_index INTEGER;
    v_is_correct BOOLEAN;
    v_attempt_id UUID;
BEGIN
    -- 1. Ensure User is Authenticated
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Attempt Protection (Debounce duplicate submissions within 10 seconds)
    IF EXISTS (
        SELECT 1 FROM public.quiz_attempts 
        WHERE quiz_id = p_quiz_id 
        AND user_id = v_user_id 
        AND completed_at > now() - interval '10 seconds'
    ) THEN
        RAISE EXCEPTION 'Duplicate submission detected.';
    END IF;

    -- 3. Transactional Scoring & Enriched JSONB Construction
    FOR v_question IN
        SELECT id, correct_answer_index FROM public.questions WHERE quiz_id = p_quiz_id
    LOOP
        v_total_questions := v_total_questions + 1;
        
        -- Extract user's selected answer safely
        v_selected_index := (p_answers->>v_question.id::text)::INTEGER;
        
        v_is_correct := (v_selected_index IS NOT NULL AND v_selected_index = v_question.correct_answer_index);
        
        IF v_is_correct THEN
            v_score := v_score + 1;
        END IF;

        -- Construct the enriched nested object: { "question_id": { "selected": X, "correct": Y } }
        v_enriched_answers := jsonb_set(
            v_enriched_answers,
            array[v_question.id::text],
            jsonb_build_object('selected', v_selected_index, 'correct', v_question.correct_answer_index)
        );
    END LOOP;

    -- 4. Audit Data Insertion
    INSERT INTO public.quiz_attempts (
        quiz_id, 
        user_id, 
        score, 
        total_questions, 
        answers
    ) VALUES (
        p_quiz_id,
        v_user_id,
        v_score,
        v_total_questions,
        v_enriched_answers
    ) RETURNING id INTO v_attempt_id;

    RETURN v_attempt_id;
END;
$$;
