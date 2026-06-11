export type DocumentStatus = 'uploaded' | 'extracting' | 'generating' | 'completed' | 'failed';

export interface Document {
  id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  status: DocumentStatus;
  upload_date: string;
}

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface Quiz {
  id: string;
  user_id: string;
  document_id: string | null;
  title: string;
  difficulty: QuizDifficulty;
  is_public: boolean;
  share_token: string;
  created_at: string;
}

export interface AnswerRecord {
  selected: number | null;
  correct: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  answers: Record<string, AnswerRecord>;
  completed_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
}
