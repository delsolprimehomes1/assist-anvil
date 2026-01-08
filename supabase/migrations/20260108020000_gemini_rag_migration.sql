-- Add Gemini columns to carrier_guidelines
ALTER TABLE carrier_guidelines 
ADD COLUMN IF NOT EXISTS gemini_file_uri TEXT,
ADD COLUMN IF NOT EXISTS gemini_file_name TEXT,
ADD COLUMN IF NOT EXISTS gemini_uploaded_at TIMESTAMPTZ;

-- Drop guideline_chunks table (not needed anymore!)
DROP TABLE IF EXISTS guideline_chunks CASCADE;

-- Drop obsolete RPC function
DROP FUNCTION IF EXISTS match_guideline_chunks;

-- Optional: We could drop the vector extension if no other tables use it, 
-- but safer to keep it enabled for now in case logic changes or other features use it.
-- DROP EXTENSION IF EXISTS vector;
