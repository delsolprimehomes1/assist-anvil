-- Create lead_captures table for A2P compliant lead submissions
CREATE TABLE public.lead_captures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  sms_consent BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  consent_text TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  source TEXT DEFAULT 'homepage',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_captures ENABLE ROW LEVEL SECURITY;

-- Allow public INSERT (for anonymous form submissions)
CREATE POLICY "Anyone can submit lead capture form"
ON public.lead_captures
FOR INSERT
WITH CHECK (true);

-- Only admins can view lead captures
CREATE POLICY "Admins can view all lead captures"
ON public.lead_captures
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update lead captures
CREATE POLICY "Admins can update lead captures"
ON public.lead_captures
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete lead captures
CREATE POLICY "Admins can delete lead captures"
ON public.lead_captures
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));