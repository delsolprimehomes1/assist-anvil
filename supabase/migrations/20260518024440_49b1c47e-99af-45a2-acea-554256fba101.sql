-- Recount function: sets contracts_approved/pending on hierarchy_agents for a given agent
CREATE OR REPLACE FUNCTION public.recount_agent_contracts(_agent_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.hierarchy_agents
  SET
    contracts_approved = (
      SELECT COUNT(*) FROM public.carrier_contracts
      WHERE agent_id = _agent_id AND contract_status = 'active'
    ),
    contracts_pending = (
      SELECT COUNT(*) FROM public.carrier_contracts
      WHERE agent_id = _agent_id AND contract_status = 'pending'
    ),
    updated_at = now()
  WHERE user_id = _agent_id;
END;
$$;

-- Trigger dispatcher
CREATE OR REPLACE FUNCTION public.trg_recount_agent_contracts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recount_agent_contracts(OLD.agent_id);
    RETURN OLD;
  ELSE
    PERFORM public.recount_agent_contracts(NEW.agent_id);
    IF TG_OP = 'UPDATE' AND NEW.agent_id IS DISTINCT FROM OLD.agent_id THEN
      PERFORM public.recount_agent_contracts(OLD.agent_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS carrier_contracts_recount_ins ON public.carrier_contracts;
DROP TRIGGER IF EXISTS carrier_contracts_recount_upd ON public.carrier_contracts;
DROP TRIGGER IF EXISTS carrier_contracts_recount_del ON public.carrier_contracts;

CREATE TRIGGER carrier_contracts_recount_ins
AFTER INSERT ON public.carrier_contracts
FOR EACH ROW EXECUTE FUNCTION public.trg_recount_agent_contracts();

CREATE TRIGGER carrier_contracts_recount_upd
AFTER UPDATE OF contract_status, agent_id ON public.carrier_contracts
FOR EACH ROW EXECUTE FUNCTION public.trg_recount_agent_contracts();

CREATE TRIGGER carrier_contracts_recount_del
AFTER DELETE ON public.carrier_contracts
FOR EACH ROW EXECUTE FUNCTION public.trg_recount_agent_contracts();

-- One-time backfill
UPDATE public.hierarchy_agents ha
SET
  contracts_approved = COALESCE(c.approved_ct, 0),
  contracts_pending  = COALESCE(c.pending_ct, 0),
  updated_at = now()
FROM (
  SELECT
    agent_id,
    COUNT(*) FILTER (WHERE contract_status = 'active')  AS approved_ct,
    COUNT(*) FILTER (WHERE contract_status = 'pending') AS pending_ct
  FROM public.carrier_contracts
  GROUP BY agent_id
) c
WHERE ha.user_id = c.agent_id;