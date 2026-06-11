ALTER TABLE public.quiz_attempts ADD COLUMN answers JSONB DEFAULT '{}'::jsonb NOT NULL;
