import React from 'react';
import { CheckCircle2, XCircle, Award, ArrowLeft, Target, BrainCircuit } from 'lucide-react';
import { Question, QuizAttempt, Quiz } from '../../types/database';

interface QuizResultsProps {
  quiz: Quiz;
  attempt: QuizAttempt;
  questions: Question[];
  onBackToDashboard: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({ quiz, attempt, questions, onBackToDashboard }) => {
  const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
  
  // Dynamic grading colors
  let gradeColor = 'text-red-500';
  let gradeBg = 'bg-red-50';
  if (percentage >= 80) {
    gradeColor = 'text-green-500';
    gradeBg = 'bg-green-50';
  } else if (percentage >= 60) {
    gradeColor = 'text-amber-500';
    gradeBg = 'bg-amber-50';
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Hero Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-8 sm:p-10 text-center border-b border-slate-100">
          <div className={`inline-flex p-4 rounded-2xl ${gradeBg} mb-6`}>
            <Award className={`h-12 w-12 ${gradeColor}`} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Quiz Completed!</h1>
          <p className="text-slate-500 text-lg mb-8">{quiz.title}</p>
          
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Score</p>
              <p className={`text-4xl font-bold ${gradeColor}`}>{percentage}%</p>
            </div>
            <div className="w-px bg-slate-200 hidden sm:block"></div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Results</p>
              <p className="text-4xl font-bold text-slate-900">{attempt.score} <span className="text-2xl text-slate-400">/ {attempt.total_questions}</span></p>
            </div>
            <div className="w-px bg-slate-200 hidden sm:block"></div>
            <div className="text-center flex flex-col justify-center">
               <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-700 capitalize">
                <Target className="h-4 w-4" /> {quiz.difficulty}
              </span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="bg-slate-50 p-6 flex justify-center">
          <button 
            onClick={onBackToDashboard}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
        </div>
      </div>

      {/* Review Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary-600" /> Answer Review
        </h2>
        <p className="text-slate-500 mt-1">Review your mistakes and read the explanations to improve.</p>
      </div>

      <div className="space-y-6">
        {questions.map((q, index) => {
          // Look up the user's specific answer payload for this question
          const answerRecord = attempt.answers[q.id];
          const isCorrect = answerRecord?.selected === answerRecord?.correct;
          // Unanswered state check (e.g. if they ran out of time)
          const userUnanswered = answerRecord?.selected === null || answerRecord?.selected === undefined;

          return (
            <div key={q.id} className={`bg-white rounded-2xl border ${isCorrect ? 'border-green-200' : 'border-red-200'} shadow-sm overflow-hidden`}>
              <div className={`p-6 border-b ${isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} flex items-start gap-4`}>
                <div className="mt-1 flex-shrink-0">
                  {isCorrect ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-slate-900">
                    <span className="text-slate-500 mr-2">{index + 1}.</span> 
                    {q.question_text}
                  </h3>
                  {userUnanswered && (
                    <span className="inline-block mt-2 text-xs font-semibold px-2 py-1 bg-red-100 text-red-700 rounded-md">
                      Not Answered
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  {q.options.map((option, optIdx) => {
                    const isSelected = answerRecord?.selected === optIdx;
                    const isActuallyCorrect = q.correct_answer_index === optIdx;
                    
                    let bgClass = "bg-white border-slate-200";
                    let textClass = "text-slate-700";
                    let icon = null;

                    if (isActuallyCorrect) {
                      bgClass = "bg-green-50 border-green-500";
                      textClass = "text-green-900 font-medium";
                      icon = <CheckCircle2 className="h-5 w-5 text-green-600" />;
                    } else if (isSelected && !isActuallyCorrect) {
                      bgClass = "bg-red-50 border-red-500";
                      textClass = "text-red-900";
                      icon = <XCircle className="h-5 w-5 text-red-600" />;
                    }

                    return (
                      <div key={optIdx} className={`p-4 rounded-xl border-2 flex items-center justify-between transition-colors ${bgClass}`}>
                        <span className={textClass}>{option}</span>
                        {icon}
                      </div>
                    );
                  })}
                </div>
                
                {/* Educational Explanation Box */}
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-2">Explanation</h4>
                  <p className="text-blue-800 text-sm leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
