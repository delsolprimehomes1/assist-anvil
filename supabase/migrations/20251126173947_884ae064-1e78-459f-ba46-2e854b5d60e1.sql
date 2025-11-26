-- Add approval_status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN approval_status TEXT DEFAULT 'pending' 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Create onboarding_requests table to store detailed onboarding data
CREATE TABLE public.onboarding_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  agency_code TEXT,
  referred_by TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on onboarding_requests
ALTER TABLE public.onboarding_requests ENABLE ROW LEVEL SECURITY;

-- Admins can view all onboarding requests
CREATE POLICY "Admins can view all onboarding requests"
ON public.onboarding_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update onboarding requests
CREATE POLICY "Admins can update onboarding requests"
ON public.onboarding_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Users can view their own onboarding request
CREATE POLICY "Users can view own onboarding request"
ON public.onboarding_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Anyone authenticated can insert their own onboarding request
CREATE POLICY "Users can insert own onboarding request"
ON public.onboarding_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add trigger to update updated_at
CREATE TRIGGER update_onboarding_requests_updated_at
BEFORE UPDATE ON public.onboarding_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing profiles to have 'approved' status (for current users)
UPDATE public.profiles SET approval_status = 'approved' WHERE approval_status IS NULL;