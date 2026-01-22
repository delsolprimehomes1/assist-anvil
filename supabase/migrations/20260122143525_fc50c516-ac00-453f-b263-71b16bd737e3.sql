-- Create function to auto-create hierarchy record for new profiles
CREATE OR REPLACE FUNCTION public.create_hierarchy_agent_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create hierarchy record for new user as a root agent (no parent initially)
  -- They will be placed under their inviter when accepting an invitation
  INSERT INTO public.hierarchy_agents (
    user_id,
    path,
    depth,
    status,
    tier,
    verification_complete,
    joined_at
  ) VALUES (
    NEW.id,
    replace(NEW.id::text, '-', '_'),
    0,
    'active',
    'new_agent',
    false,
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on profiles table
CREATE TRIGGER on_profile_created_create_hierarchy
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_hierarchy_agent_for_new_user();

-- Fix Mike Check's missing hierarchy record
INSERT INTO public.hierarchy_agents (
  user_id,
  path,
  depth,
  status,
  tier,
  verification_complete,
  joined_at
) VALUES (
  '1a6ade4c-69ba-4d6f-b0f9-6b8beef029e2',
  '1a6ade4c_69ba_4d6f_b0f9_6b8beef029e2',
  0,
  'active',
  'new_agent',
  false,
  now()
) ON CONFLICT (user_id) DO NOTHING;