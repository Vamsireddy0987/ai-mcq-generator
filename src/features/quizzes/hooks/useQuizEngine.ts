import { useState, useEffect, useCallback } from 'react';
import { Question, AnswerRecord } from '../../../types/database';

interface UseQuizEngineProps {
  quizId: string;
  questions: Question[];
  onSubmit: (rawAnswers: Record<string, number | null>) => Promise<void>;
  timeLimitSeconds?: number;
}

export const useQuizEngine = ({ 
  quizId, 
  questions, 
  onSubmit, 
  timeLimitSeconds = 600 // default 10 minutes
}: UseQuizEngineProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>(() => {
    // Auto-save feature: attempt to load from local storage
    const saved = localStorage.getItem(`quiz_draft_${quizId}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [timeRemaining, setTimeRemaining] = useState(timeLimitSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer logic
  useEffect(() => {
    if (timeRemaining <= 0 || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto-submit when time is up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitting]);

  // Auto-save logic
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(`quiz_draft_${quizId}`, JSON.stringify(answers));
    }
  }, [answers, quizId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const selectOption = useCallback((questionId: string, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        selected: optionIndex,
        correct: -1 // Ignored, handled by backend
      }
    }));
  }, []);

  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
  }, [currentIndex, questions.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  }, [currentIndex]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    
    // Construct raw answers payload for RPC: { [questionId]: selectedIndex }
    const rawAnswers: Record<string, number | null> = {};
    questions.forEach(q => {
      rawAnswers[q.id] = answers[q.id]?.selected ?? null;
    });

    try {
      await onSubmit(rawAnswers);
      // Clean up local storage after successful submission
      localStorage.removeItem(`quiz_draft_${quizId}`);
    } catch (err) {
      console.error("Failed to submit quiz", err);
      setIsSubmitting(false);
      throw err;
    }
  }, [answers, questions, onSubmit, quizId]);

  return {
    currentQuestion: questions[currentIndex],
    currentIndex,
    totalQuestions: questions.length,
    answers,
    timeRemaining,
    isSubmitting,
    selectOption,
    goToNext,
    goToPrev,
    handleSubmit
  };
};
