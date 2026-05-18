ALTER TABLE public.hierarchy_agents
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.set_agent_verification(
  target_user_id uuid,
  is_verified boolean
)
RETURNS public.hierarchy_agents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_row public.hierarchy_agents;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change verification status';
  END IF;

  UPDATE public.hierarchy_agents
  SET
    verification_complete = is_verified,
    verified_at = CASE WHEN is_verified THEN now() ELSE NULL END,
    verified_by = CASE WHEN is_verified THEN auth.uid() ELSE NULL END,
    updated_at = now()
  WHERE user_id = target_user_id
  RETURNING * INTO updated_row;

  IF updated_row IS NULL THEN
    RAISE EXCEPTION 'Agent % not found', target_user_id;
  END IF;

  RETURN updated_row;
END;
$$;

REVOKE ALL ON FUNCTION public.set_agent_verification(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_agent_verification(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_agent_verification(uuid, boolean) TO authenticated;