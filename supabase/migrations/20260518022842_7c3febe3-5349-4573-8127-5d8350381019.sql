
CREATE OR REPLACE FUNCTION public.sync_license_exp_to_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.hierarchy_agents
  SET
    resident_license_exp = NEW.resident_license_exp,
    ce_due_date          = NEW.ce_due_date,
    updated_at           = now()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_license_exp_to_hierarchy ON public.agent_profiles;
CREATE TRIGGER sync_license_exp_to_hierarchy
AFTER INSERT OR UPDATE OF resident_license_exp, ce_due_date
ON public.agent_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_license_exp_to_hierarchy();

UPDATE public.hierarchy_agents ha
SET
  resident_license_exp = ap.resident_license_exp,
  ce_due_date          = ap.ce_due_date,
  updated_at           = now()
FROM public.agent_profiles ap
WHERE ha.user_id = ap.id
  AND (
    ha.resident_license_exp IS DISTINCT FROM ap.resident_license_exp
    OR ha.ce_due_date        IS DISTINCT FROM ap.ce_due_date
  );
