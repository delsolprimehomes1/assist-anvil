-- Add accepted_at column to track when invitations were accepted
ALTER TABLE public.user_invitations 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ NULL;