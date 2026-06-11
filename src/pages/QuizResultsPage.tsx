import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Quiz, Question, QuizAttempt } from '../types/database';
import { QuizResults } from '../features/quizzes/QuizResults';

export const QuizResultsPage = () => {
  const { quizId, attemptId } = useParams<{ quizId: string, attemptId: string }>();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!quizId || !attemptId) return;
      try {
        const { data: quizData, error: quizError } = await supabase.from('quizzes').select('*').eq('id', quizId).single();
        if (quizError) throw quizError;
        setQuiz(quizData);

        const { data: attemptData, error: attemptError } = await supabase.from('quiz_attempts').select('*').eq('id', attemptId).single();
        if (attemptError) throw attemptError;
        setAttempt(attemptData);

        // Fetch full questions including explanations and correct answers for the review page
        const { data: questionsData, error: questionsError } = await supabase.from('questions').select('*').eq('quiz_id', quizId);
        if (questionsError) throw questionsError;
        setQuestions(questionsData as Question[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [quizId, attemptId]);

  if (loading) return <div className="text-center py-20 text-slate-500 animate-pulse">Loading results...</div>;
  if (error || !quiz || !attempt) return <div className="text-center py-20 text-red-500 bg-red-50 p-4 rounded-xl max-w-md mx-auto mt-10">Error: {error || 'Data not found'}</div>;

  return (
    <div className="pb-12">
      <QuizResults 
        quiz={quiz}
        attempt={attempt}
        questions={questions}
        onBackToDashboard={() => navigate('/dashboard')}
      />
    </div>
  );
};
