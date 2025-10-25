-- Update pdf_documents structure to include title and button_label
UPDATE carriers
SET pdf_documents = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'title', doc->>'name',
      'button_label', 
        CASE 
          WHEN doc->>'name' ILIKE '%underwriting%' THEN 'Underwriting Guide'
          WHEN doc->>'name' ILIKE '%training%' THEN 'Training Guide'
          WHEN doc->>'name' ILIKE '%producer%' THEN 'Producer Guide'
          WHEN doc->>'name' ILIKE '%guidelines%' THEN 'Guidelines'
          WHEN doc->>'name' ILIKE '%term%ms%' THEN 'Term MS Guide'
          WHEN doc->>'name' ILIKE '%senior%choice%' THEN 'Senior Choice Guide'
          WHEN doc->>'name' ILIKE '%safecare%' THEN 'SafeCare Term Guide'
          WHEN doc->>'name' ILIKE '%intelligent%choice%iul%' THEN 'Intelligent Choice IUL'
          WHEN doc->>'name' ILIKE '%apriority%' THEN 'APriority Guide'
          ELSE regexp_replace(doc->>'name', '^.+?\s+-\s+', '', 'i')
        END,
      'url', doc->>'url'
    )
  )
  FROM jsonb_array_elements(pdf_documents) AS doc
)
WHERE pdf_documents IS NOT NULL 
  AND pdf_documents != '[]'::jsonb
  AND jsonb_array_length(pdf_documents) > 0;