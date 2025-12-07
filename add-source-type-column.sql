-- Add source_type column to summaries table
-- Run this in Supabase SQL Editor

ALTER TABLE public.summaries 
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'text';

-- Update existing records
UPDATE public.summaries 
SET source_type = 'text' 
WHERE source_type IS NULL;

-- Add check constraint
ALTER TABLE public.summaries 
ADD CONSTRAINT summaries_source_type_check 
CHECK (source_type IN ('text', 'audio', 'youtube'));
