import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Quiz, Question } from '../types/database';
import { QuizPlayer } from '../features/quizzes/QuizPlayer';

export const QuizTake = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!quizId) return;
      try {
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) throw quizError;
        setQuiz(quizData);

        // Security Feature: Only select necessary fields. Exclude correct_answer_index and explanation!
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('id, quiz_id, question_text, options') 
          .eq('quiz_id', quizId);

        if (questionsError) throw questionsError;
        
        setQuestions(questionsData as Question[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId]);

  const handleSubmit = async (rawAnswers: Record<string, number | null>) => {
    if (!quizId) return;
    
    // Secure RPC Backend Submission
    const { data: attemptId, error } = await supabase.rpc('submit_quiz_attempt', {
      p_quiz_id: quizId,
      p_answers: rawAnswers
    });

    if (error) {
      throw error;
    }

    if (attemptId) {
      navigate(`/quiz/${quizId}/results/${attemptId}`);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-500 animate-pulse">Loading quiz...</div>;
  if (error || !quiz) return <div className="text-center py-20 text-red-500">Error: {error || 'Quiz not found'}</div>;
  if (questions.length === 0) return <div className="text-center py-20 text-slate-500">No questions found for this quiz.</div>;

  return (
    <div className="pb-12">
      <QuizPlayer 
        quizId={quiz.id}
        quizTitle={quiz.title}
        questions={questions}
        onSubmit={handleSubmit}
        timeLimitSeconds={questions.length * 60} // 1 minute per question default
      />
    </div>
  );
};
