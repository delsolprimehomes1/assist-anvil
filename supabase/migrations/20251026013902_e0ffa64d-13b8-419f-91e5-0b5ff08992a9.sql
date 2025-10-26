-- Create user_brand_kits table
CREATE TABLE public.user_brand_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#8b5cf6',
  accent_color TEXT DEFAULT '#06b6d4',
  text_color TEXT DEFAULT '#1e293b',
  tagline TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user_marketing_templates table
CREATE TABLE public.user_marketing_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('canva_template', 'email_script', 'sms_script', 'brand_asset')),
  description TEXT NOT NULL,
  content TEXT,
  url TEXT,
  file_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_marketing_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_brand_kits
CREATE POLICY "Users can view own brand kit"
  ON public.user_brand_kits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand kit"
  ON public.user_brand_kits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand kit"
  ON public.user_brand_kits
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand kit"
  ON public.user_brand_kits
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all brand kits"
  ON public.user_brand_kits
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_marketing_templates
CREATE POLICY "Users can view own templates"
  ON public.user_marketing_templates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON public.user_marketing_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON public.user_marketing_templates
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON public.user_marketing_templates
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all templates"
  ON public.user_marketing_templates
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_user_brand_kits_updated_at
  BEFORE UPDATE ON public.user_brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_marketing_templates_updated_at
  BEFORE UPDATE ON public.user_marketing_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for brand-assets bucket
CREATE POLICY "Users can upload own brand assets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'brand-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own brand assets"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'brand-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own brand assets"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'brand-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own brand assets"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'brand-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );