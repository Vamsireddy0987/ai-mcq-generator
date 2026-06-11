import React, { useEffect } from 'react';
import { Clock, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Question, AnswerRecord } from '../../types/database';
import { useQuizEngine } from './hooks/useQuizEngine';

interface QuizPlayerProps {
  quizId: string;
  quizTitle: string;
  questions: Question[];
  onSubmit: (rawAnswers: Record<string, number | null>) => Promise<void>;
  timeLimitSeconds?: number;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ 
  quizId, 
  quizTitle, 
  questions, 
  onSubmit, 
  timeLimitSeconds = 600 
}) => {
  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    answers,
    timeRemaining,
    isSubmitting,
    selectOption,
    goToNext,
    goToPrev,
    handleSubmit
  } = useQuizEngine({ quizId, questions, onSubmit, timeLimitSeconds });

  // Format time
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const progressPercentage = ((currentIndex + 1) / totalQuestions) * 100;
  const currentAnswer = answers[currentQuestion.id]?.selected;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header & Meta */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{quizTitle}</h2>
            <p className="text-sm text-slate-500 mt-1">Question {currentIndex + 1} of {totalQuestions}</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
            <Clock className={`h-5 w-5 ${timeRemaining < 60 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
            <span className={`font-mono font-medium ${timeRemaining < 60 ? 'text-red-600' : 'text-slate-700'}`}>
              {timeString}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
          <div 
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Active Question Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-8 border-b border-slate-100">
          <h3 className="text-lg sm:text-xl font-medium text-slate-900 leading-relaxed">
            {currentQuestion.question_text}
          </h3>
        </div>
        <div className="p-8 bg-slate-50">
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = currentAnswer === index;
              return (
                <button
                  key={index}
                  onClick={() => selectOption(currentQuestion.id, index)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 focus:outline-none focus:ring-4 focus:ring-primary-100 ${
                    isSelected 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${
                    isSelected ? 'border-primary-500 bg-primary-500' : 'border-slate-300'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className={`text-base ${isSelected ? 'text-primary-900 font-medium' : 'text-slate-700'}`}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Navigation Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0 || isSubmitting}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" /> Previous
        </button>

        {currentIndex === totalQuestions - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-70 transition-colors shadow-sm hover:shadow"
          >
            {isSubmitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Submitting...</>
            ) : (
              <><CheckCircle2 className="h-5 w-5" /> Submit Quiz</>
            )}
          </button>
        ) : (
          <button
            onClick={goToNext}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-70 transition-colors shadow-sm hover:shadow"
          >
            Next <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};
