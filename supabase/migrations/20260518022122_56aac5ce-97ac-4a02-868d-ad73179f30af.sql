
CREATE OR REPLACE FUNCTION public.update_my_last_login()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.hierarchy_agents
  SET last_login_at = now(),
      last_activity_at = now(),
      updated_at = now()
  WHERE user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.update_my_last_login() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_last_login() TO authenticated;
