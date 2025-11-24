-- Create carrier_news table
CREATE TABLE public.carrier_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  news_type TEXT NOT NULL CHECK (news_type IN ('state_approval', 'product_update', 'new_product', 'rate_change', 'underwriting_change', 'general')),
  carrier_id UUID REFERENCES public.carriers(id) ON DELETE SET NULL,
  carrier_name TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  published_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archive_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attachment_url TEXT,
  tags TEXT[] DEFAULT '{}',
  views_count INTEGER NOT NULL DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX idx_carrier_news_status ON public.carrier_news(status);
CREATE INDEX idx_carrier_news_published_date ON public.carrier_news(published_date DESC);
CREATE INDEX idx_carrier_news_carrier_id ON public.carrier_news(carrier_id);
CREATE INDEX idx_carrier_news_news_type ON public.carrier_news(news_type);
CREATE INDEX idx_carrier_news_archive_date ON public.carrier_news(archive_date);

-- Enable RLS
ALTER TABLE public.carrier_news ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can manage all news
CREATE POLICY "Admins can manage all carrier news"
ON public.carrier_news
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Agents can view published, non-archived news
CREATE POLICY "Agents can view published news"
ON public.carrier_news
FOR SELECT
USING (
  status = 'published' 
  AND (archive_date IS NULL OR archive_date > now())
);

-- Update trigger for updated_at
CREATE TRIGGER update_carrier_news_updated_at
BEFORE UPDATE ON public.carrier_news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for news attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('carrier-news-attachments', 'carrier-news-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Admins can upload news attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'carrier-news-attachments' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete news attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'carrier-news-attachments' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Everyone can view news attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'carrier-news-attachments');