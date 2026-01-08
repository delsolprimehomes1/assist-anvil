-- Add file_path column to store the actual storage path (no URL parsing needed)
ALTER TABLE public.carrier_guidelines
ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.carrier_guidelines.file_path IS 'The actual storage path used when uploading (e.g., Assurity/Term-Life/file.pdf)';