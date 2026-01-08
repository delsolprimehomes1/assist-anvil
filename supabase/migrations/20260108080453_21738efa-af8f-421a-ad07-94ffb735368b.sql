-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Create carrier_guidelines table
CREATE TABLE public.carrier_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'underwriting_guide',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  processing_error TEXT,
  effective_date DATE,
  expiration_date DATE,
  min_age INTEGER,
  max_age INTEGER,
  min_coverage NUMERIC,
  max_coverage NUMERIC,
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create guideline_chunks table with vector embedding (1536 dimensions for text-embedding-3-small)
CREATE TABLE public.guideline_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guideline_id UUID NOT NULL REFERENCES public.carrier_guidelines(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create underwriting_chats table
CREATE TABLE public.underwriting_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create underwriting_messages table
CREATE TABLE public.underwriting_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.underwriting_chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.carrier_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guideline_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.underwriting_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.underwriting_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for carrier_guidelines
CREATE POLICY "Admins can manage carrier guidelines"
  ON public.carrier_guidelines FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read carrier guidelines"
  ON public.carrier_guidelines FOR SELECT
  TO authenticated
  USING (true);

-- RLS policies for guideline_chunks
CREATE POLICY "Admins can manage guideline chunks"
  ON public.guideline_chunks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read guideline chunks"
  ON public.guideline_chunks FOR SELECT
  TO authenticated
  USING (true);

-- RLS policies for underwriting_chats
CREATE POLICY "Users can manage their own chats"
  ON public.underwriting_chats FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all chats"
  ON public.underwriting_chats FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for underwriting_messages
CREATE POLICY "Users can manage messages in their chats"
  ON public.underwriting_messages FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.underwriting_chats
    WHERE id = underwriting_messages.chat_id
    AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.underwriting_chats
    WHERE id = underwriting_messages.chat_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all messages"
  ON public.underwriting_messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_carrier_guidelines_carrier_name ON public.carrier_guidelines(carrier_name);
CREATE INDEX idx_carrier_guidelines_status ON public.carrier_guidelines(status);
CREATE INDEX idx_guideline_chunks_guideline_id ON public.guideline_chunks(guideline_id);
CREATE INDEX idx_underwriting_messages_chat_id ON public.underwriting_messages(chat_id);

-- Create HNSW vector index for similarity search (1536 dimensions)
CREATE INDEX idx_guideline_chunks_embedding ON public.guideline_chunks 
  USING hnsw (embedding vector_cosine_ops);

-- Create match_guideline_chunks RPC function
CREATE OR REPLACE FUNCTION public.match_guideline_chunks(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 10,
  filter_carrier_id UUID DEFAULT NULL,
  filter_age INT DEFAULT NULL,
  filter_coverage NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  guideline_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT,
  carrier_name TEXT,
  product_type TEXT,
  document_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  WHERE cg.status = 'active'
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
$$;

-- Create updated_at triggers
CREATE TRIGGER update_carrier_guidelines_updated_at
  BEFORE UPDATE ON public.carrier_guidelines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_underwriting_chats_updated_at
  BEFORE UPDATE ON public.underwriting_chats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for carrier guidelines
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'carrier-guidelines',
  'carrier-guidelines',
  false,
  52428800,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Admins can manage carrier guideline files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'carrier-guidelines' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'carrier-guidelines' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read carrier guideline files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'carrier-guidelines');