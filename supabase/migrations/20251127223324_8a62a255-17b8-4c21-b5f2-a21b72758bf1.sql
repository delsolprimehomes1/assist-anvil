-- Create rag_uploads table for tracking document uploads
CREATE TABLE public.rag_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rag_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage RAG uploads
CREATE POLICY "Admins can view all RAG uploads"
  ON public.rag_uploads
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert RAG uploads"
  ON public.rag_uploads
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update RAG uploads"
  ON public.rag_uploads
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete RAG uploads"
  ON public.rag_uploads
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for RAG documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('rag-documents', 'rag-documents', false);

-- Storage policies for rag-documents bucket
CREATE POLICY "Admins can upload RAG documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'rag-documents' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can view RAG documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'rag-documents' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete RAG documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'rag-documents' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_rag_uploads_updated_at
  BEFORE UPDATE ON public.rag_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();