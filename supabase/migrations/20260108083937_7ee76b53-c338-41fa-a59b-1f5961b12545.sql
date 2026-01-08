-- Add new columns to carrier_guidelines for tracking processing progress
ALTER TABLE public.carrier_guidelines 
ADD COLUMN IF NOT EXISTS chunks_processed_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_time_ms integer,
ADD COLUMN IF NOT EXISTS last_processing_at timestamptz;

-- Update match_guideline_chunks to include 'partial' status
CREATE OR REPLACE FUNCTION public.match_guideline_chunks(
  query_embedding extensions.vector, 
  match_threshold double precision DEFAULT 0.3, 
  match_count integer DEFAULT 10, 
  filter_carrier_id uuid DEFAULT NULL::uuid, 
  filter_age integer DEFAULT NULL::integer, 
  filter_coverage numeric DEFAULT NULL::numeric
)
RETURNS TABLE(
  id uuid, 
  guideline_id uuid, 
  content text, 
  metadata jsonb, 
  similarity double precision, 
  carrier_name text, 
  product_type text, 
  document_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    gc.id,
    gc.guideline_id,
    gc.content,
    gc.metadata,
    1 - (gc.embedding <=> query_embedding) AS similarity,
    cg.carrier_name,
    cg.product_type,
    cg.document_type
  FROM public.guideline_chunks gc
  JOIN public.carrier_guidelines cg ON gc.guideline_id = cg.id
  WHERE cg.status IN ('active', 'partial')
    AND (filter_carrier_id IS NULL OR cg.id = filter_carrier_id)
    AND (filter_age IS NULL OR (
      (cg.min_age IS NULL OR filter_age >= cg.min_age) AND
      (cg.max_age IS NULL OR filter_age <= cg.max_age)
    ))
    AND (filter_coverage IS NULL OR (
      (cg.min_coverage IS NULL OR filter_coverage >= cg.min_coverage) AND
      (cg.max_coverage IS NULL OR filter_coverage <= cg.max_coverage)
    ))
    AND 1 - (gc.embedding <=> query_embedding) > match_threshold
  ORDER BY gc.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;