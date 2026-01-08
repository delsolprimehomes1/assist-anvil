-- Add missing columns to carrier_guidelines
ALTER TABLE carrier_guidelines 
ADD COLUMN IF NOT EXISTS file_path text,
ADD COLUMN IF NOT EXISTS chunks_processed_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_time_ms integer,
ADD COLUMN IF NOT EXISTS last_processing_at timestamp with time zone;

-- Create missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_carrier_guidelines_carrier_name ON carrier_guidelines(carrier_name);
CREATE INDEX IF NOT EXISTS idx_carrier_guidelines_status ON carrier_guidelines(status);
CREATE INDEX IF NOT EXISTS idx_guideline_chunks_guideline_id ON guideline_chunks(guideline_id);
CREATE INDEX IF NOT EXISTS idx_underwriting_messages_chat_id ON underwriting_messages(chat_id);

-- Update the RPC function to include 'partial' status and match strict filter requirements
CREATE OR REPLACE FUNCTION match_guideline_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_carrier_id uuid default null,
  filter_age int default null,
  filter_coverage decimal default null
)
RETURNS TABLE (
  id uuid,
  guideline_id uuid,
  chunk_text text,
  chunk_index int,
  page_number int,
  section_title text,
  metadata jsonb,
  similarity float,
  carrier_name text,
  product_type text,
  document_type text,
  effective_date date
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    gc.id,
    gc.guideline_id,
    gc.chunk_text,
    gc.chunk_index,
    gc.page_number,
    gc.section_title,
    gc.metadata,
    1 - (gc.embedding <=> query_embedding) AS similarity,
    cg.carrier_name,
    cg.product_type,
    cg.document_type,
    cg.effective_date
  FROM guideline_chunks gc
  JOIN carrier_guidelines cg ON gc.guideline_id = cg.id
  WHERE 1 - (gc.embedding <=> query_embedding) > match_threshold
  -- Critical fix: Allow 'active' AND 'partial' status
  AND cg.status IN ('active', 'partial')
  AND (filter_carrier_id IS NULL OR cg.carrier_id = filter_carrier_id)
  -- Logic for ranges: if guideline metric is null, it's considered "open" or "all ages/coverage"
  -- If filter_age is provided:
  --   Must be >= guideline.age_min (if min exists)
  --   AND <= guideline.age_max (if max exists)
  AND (filter_age IS NULL OR (
      (cg.age_min IS NULL OR cg.age_min <= filter_age) AND 
      (cg.age_max IS NULL OR cg.age_max >= filter_age)
  ))
  AND (filter_coverage IS NULL OR (
      (cg.coverage_min IS NULL OR cg.coverage_min <= filter_coverage) AND 
      (cg.coverage_max IS NULL OR cg.coverage_max >= filter_coverage)
  ))
  ORDER BY gc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
