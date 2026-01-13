-- Create password_reset_requests table for admin-managed password resets
CREATE TABLE public.password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID
);

-- Enable RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form - no auth required)
CREATE POLICY "Anyone can submit password reset requests"
  ON public.password_reset_requests FOR INSERT
  WITH CHECK (true);

-- Only admins can view password reset requests
CREATE POLICY "Admins can view password reset requests"
  ON public.password_reset_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update password reset requests
CREATE POLICY "Admins can update password reset requests"
  ON public.password_reset_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));