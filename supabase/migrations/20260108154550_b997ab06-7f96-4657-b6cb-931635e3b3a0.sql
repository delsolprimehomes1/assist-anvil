-- Add assigned_manager column to onboarding_requests table
ALTER TABLE public.onboarding_requests
ADD COLUMN assigned_manager text;