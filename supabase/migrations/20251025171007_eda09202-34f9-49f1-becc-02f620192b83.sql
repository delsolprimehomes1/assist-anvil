-- Create carriers table
CREATE TABLE public.carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_code TEXT NOT NULL UNIQUE,
  am_best_rating TEXT,
  headquarters TEXT,
  phone TEXT,
  founded TEXT,
  employees TEXT,
  website TEXT,
  description TEXT,
  company_history TEXT,
  logo_url TEXT,
  products TEXT[] DEFAULT '{}',
  niches TEXT[] DEFAULT '{}',
  turnaround TEXT CHECK (turnaround IN ('fast', 'average', 'slow')),
  portal_url TEXT,
  quotes_url TEXT,
  illustration_url TEXT,
  special_products TEXT[] DEFAULT '{}',
  underwriting_strengths TEXT[] DEFAULT '{}',
  pdf_documents JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;

-- Everyone can view carriers
CREATE POLICY "Anyone can view carriers"
  ON public.carriers
  FOR SELECT
  USING (true);

-- Only admins can insert carriers
CREATE POLICY "Only admins can insert carriers"
  ON public.carriers
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update carriers
CREATE POLICY "Only admins can update carriers"
  ON public.carriers
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete carriers
CREATE POLICY "Only admins can delete carriers"
  ON public.carriers
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_carriers_updated_at
  BEFORE UPDATE ON public.carriers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for carrier assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('carrier-assets', 'carrier-assets', true);

-- Storage policies for carrier assets
CREATE POLICY "Anyone can view carrier assets"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'carrier-assets');

CREATE POLICY "Admins can upload carrier assets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'carrier-assets' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update carrier assets"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'carrier-assets' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete carrier assets"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'carrier-assets' 
    AND public.has_role(auth.uid(), 'admin')
  );