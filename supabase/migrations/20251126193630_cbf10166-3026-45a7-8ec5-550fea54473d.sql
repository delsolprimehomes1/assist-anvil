-- Create marketing_resources table
CREATE TABLE public.marketing_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL,
  description text NOT NULL,
  content text,
  url text,
  file_url text,
  thumbnail_url text,
  tags text[] DEFAULT '{}',
  category text,
  status text DEFAULT 'published',
  display_order integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all marketing resources"
ON public.marketing_resources
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated users can view published resources"
ON public.marketing_resources
FOR SELECT
TO authenticated
USING (status = 'published');

-- Create storage bucket for marketing resources
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-resources', 'marketing-resources', true);

-- Storage policies
CREATE POLICY "Admins can upload marketing resources"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'marketing-resources' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update marketing resources"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'marketing-resources'
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete marketing resources"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'marketing-resources'
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "All authenticated users can view marketing resources"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'marketing-resources');

-- Trigger for updated_at
CREATE TRIGGER update_marketing_resources_updated_at
BEFORE UPDATE ON public.marketing_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();