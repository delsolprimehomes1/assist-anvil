
ALTER TABLE public.onboarding_requests
  ADD COLUMN IF NOT EXISTS resident_license_exp date,
  ADD COLUMN IF NOT EXISTS resident_license_state text,
  ADD COLUMN IF NOT EXISTS resident_license_number text,
  ADD COLUMN IF NOT EXISTS npn_number text,
  ADD COLUMN IF NOT EXISTS other_license_states text[],
  ADD COLUMN IF NOT EXISTS ce_due_date date;

ALTER TABLE public.agent_profiles
  ADD COLUMN IF NOT EXISTS license_states text[] DEFAULT '{}'::text[];
