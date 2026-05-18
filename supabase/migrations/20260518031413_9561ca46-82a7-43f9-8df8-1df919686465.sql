-- 1. Update trigger function: net_profit = SUM(expected_issue_pay) - SUM(total_lead_cost)
CREATE OR REPLACE FUNCTION public.update_weekly_business()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.hierarchy_agents
  SET 
    weekly_business_submitted = (
      SELECT COALESCE(SUM(revenue), 0)
      FROM public.agent_performance_entries
      WHERE agent_id = NEW.agent_id
      AND entry_date >= date_trunc('week', CURRENT_DATE)
    ),
    total_lead_spend = (
      SELECT COALESCE(SUM(total_lead_cost), 0)
      FROM public.agent_performance_entries
      WHERE agent_id = NEW.agent_id
    ),
    net_profit = (
      SELECT COALESCE(SUM(expected_issue_pay), 0) - COALESCE(SUM(total_lead_cost), 0)
      FROM public.agent_performance_entries
      WHERE agent_id = NEW.agent_id
    ),
    last_business_date = NEW.entry_date,
    updated_at = now()
  WHERE user_id = NEW.agent_id;
  RETURN NEW;
END;
$function$;

-- 2. One-time backfill: recompute net_profit for every agent with at least one entry
UPDATE public.hierarchy_agents ha
SET net_profit = sub.net,
    updated_at = now()
FROM (
  SELECT agent_id,
         COALESCE(SUM(expected_issue_pay), 0) - COALESCE(SUM(total_lead_cost), 0) AS net
  FROM public.agent_performance_entries
  GROUP BY agent_id
) sub
WHERE ha.user_id = sub.agent_id;