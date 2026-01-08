-- RPC function for vector similarity search
create or replace function match_guideline_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_carrier_id uuid default null,
  filter_age int default null,
  filter_coverage decimal default null
)
returns table (
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
language plpgsql
as $$
begin
  return query
  select
    gc.id,
    gc.guideline_id,
    gc.chunk_text,
    gc.chunk_index,
    gc.page_number,
    gc.section_title,
    gc.metadata,
    1 - (gc.embedding <=> query_embedding) as similarity,
    cg.carrier_name,
    cg.product_type,
    cg.document_type,
    cg.effective_date
  from guideline_chunks gc
  join carrier_guidelines cg on gc.guideline_id = cg.id
  where 1 - (gc.embedding <=> query_embedding) > match_threshold
  and (filter_carrier_id is null or cg.carrier_id = filter_carrier_id)
  and (filter_age is null or (cg.age_min is null or cg.age_min <= filter_age) and (cg.age_max is null or cg.age_max >= filter_age))
  and (filter_coverage is null or (cg.coverage_min is null or cg.coverage_min <= filter_coverage) and (cg.coverage_max is null or cg.coverage_max >= filter_coverage))
  and cg.status = 'active'
  order by gc.embedding <=> query_embedding
  limit match_count;
end;
$$;
