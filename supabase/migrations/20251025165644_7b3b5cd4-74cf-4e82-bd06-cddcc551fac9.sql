-- Create approved_admin_emails table
CREATE TABLE public.approved_admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  CONSTRAINT valid_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Enable RLS
ALTER TABLE public.approved_admin_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can manage approved emails
CREATE POLICY "Only admins can manage approved emails"
ON public.approved_admin_emails
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update handle_new_user function to check approved emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_approved_admin boolean;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Check if email is in approved admin list
  SELECT EXISTS (
    SELECT 1 FROM public.approved_admin_emails 
    WHERE email = NEW.email
  ) INTO is_approved_admin;
  
  -- Assign role based on approval status
  IF is_approved_admin THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'agent');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Pre-populate with initial admin email
INSERT INTO public.approved_admin_emails (email, notes)
VALUES ('jrmenterprisegroup@gmail.com', 'Initial admin account')
ON CONFLICT (email) DO NOTHING;