import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { QuizHistory } from '../features/quizzes/QuizHistory';

export const QuizHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      // Fetch attempts with joined quiz data
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quizzes (*)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (!error && data) {
        setAttempts(data);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [user]);

  const handleReview = (attemptId: string) => {
    const attempt = attempts.find(a => a.id === attemptId);
    if (attempt) {
      navigate(`/quiz/${attempt.quiz_id}/results/${attemptId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Quiz History</h1>
        <p className="text-slate-600 mt-1">Review your past performance and track your progress over time.</p>
      </div>
      <QuizHistory 
        attempts={attempts} 
        loading={loading} 
        onReviewAttempt={handleReview} 
      />
    </div>
  );
};
