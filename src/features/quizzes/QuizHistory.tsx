import React from 'react';
import { QuizAttempt, Quiz } from '../../types/database';
import { formatDate } from '../../utils/format';
import { Clock, Award, Target, ArrowRight } from 'lucide-react';

interface QuizHistoryItem extends QuizAttempt {
  quiz: Quiz; // Supabase joined relation
}

interface QuizHistoryProps {
  attempts: QuizHistoryItem[];
  onReviewAttempt: (attemptId: string) => void;
  loading: boolean;
}

export const QuizHistory: React.FC<QuizHistoryProps> = ({ attempts, onReviewAttempt, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
        <p className="text-slate-500 animate-pulse">Loading your history...</p>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px]">
        <Award className="h-12 w-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-1">No quizzes taken yet</h3>
        <p className="text-slate-500">Generate a quiz from a PDF to start practicing!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary-600" /> Recent Attempts
        </h3>
        <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
          {attempts.length} Total
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {attempts.map((attempt) => {
          const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
          
          let gradeColor = 'text-red-600 bg-red-50 border-red-100';
          if (percentage >= 80) {
            gradeColor = 'text-green-600 bg-green-50 border-green-100';
          } else if (percentage >= 60) {
            gradeColor = 'text-amber-600 bg-amber-50 border-amber-100';
          }

          return (
            <div key={attempt.id} className="p-6 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-slate-900 mb-2 truncate max-w-[300px] sm:max-w-[400px]">
                  {attempt.quiz.title}
                </h4>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {formatDate(attempt.completed_at)}
                  </span>
                  <span className="flex items-center gap-1.5 capitalize">
                    <Target className="h-4 w-4 text-slate-400" />
                    {attempt.quiz.difficulty}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 mt-4 sm:mt-0">
                <div className="text-right flex-1 sm:flex-none">
                  <div className={`inline-flex items-center justify-center px-3 py-1 rounded-lg border ${gradeColor} font-bold text-lg mb-1`}>
                    {percentage}%
                  </div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    {attempt.score} / {attempt.total_questions} correct
                  </p>
                </div>

                <button
                  onClick={() => onReviewAttempt(attempt.id)}
                  className="p-3 text-slate-400 hover:text-white hover:bg-primary-600 rounded-xl transition-all shadow-sm hover:shadow group-hover:bg-primary-50 group-hover:text-primary-600"
                  title="Review Answers"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
