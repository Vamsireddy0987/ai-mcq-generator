CREATE TYPE quiz_difficulty AS ENUM ('easy', 'medium', 'hard');

ALTER TABLE public.quizzes 
ADD COLUMN difficulty quiz_difficulty DEFAULT 'medium'::quiz_difficulty NOT NULL;
