-- Update ENUM type for document status
ALTER TYPE document_status RENAME TO document_status_old;
CREATE TYPE document_status AS ENUM ('uploaded', 'extracting', 'generating', 'completed', 'failed');

-- Update the column to use the new type
ALTER TABLE public.documents ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.documents ALTER COLUMN status TYPE document_status USING status::text::document_status;
ALTER TABLE public.documents ALTER COLUMN status SET DEFAULT 'uploaded'::document_status;

-- Drop the old type
DROP TYPE document_status_old;

-- Add extraction metadata columns
ALTER TABLE public.documents ADD COLUMN extracted_text TEXT;
ALTER TABLE public.documents ADD COLUMN page_count INTEGER;
ALTER TABLE public.documents ADD COLUMN char_count INTEGER;
ALTER TABLE public.documents ADD COLUMN processing_time_ms INTEGER;
