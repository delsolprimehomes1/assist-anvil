-- Insert 9 lead products from screenshot
INSERT INTO lead_products (name, category, price, min_quantity, expected_conversion, badge, status, display_order)
VALUES
  ('Verified General Life Leads', 'Verified Life', 37.00, 25, 0.25, 'Premium Lead', 'active', 1),
  ('Annuity Leads', 'Annuity', 95.00, 15, 0.30, 'MOST POPULAR', 'active', 2),
  ('IUL Leads', 'IUL', 40.00, 25, 0.24, 'Premium Lead', 'active', 3),
  ('Ethos Leads – Fresh', 'Ethos', 18.00, 50, 0.28, 'High-Intent Lead', 'active', 4),
  ('Ethos Leads – Aged', 'Ethos', 8.00, 100, 0.20, 'Value Lead', 'active', 5),
  ('Internet Leads', 'Internet', 5.00, 100, 0.18, NULL, 'active', 6),
  ('Verified Final Expense Leads', 'Final Expense', 25.00, 25, 0.22, 'Premium Lead', 'active', 7),
  ('Tele-Marketed Final Expense (FE) Leads', 'Final Expense', 12.00, 50, 0.20, 'Premium Lead', 'active', 8),
  ('Inbound CallConnect', 'Inbound Calls', 45.00, 10, 0.35, 'MOST POPULAR', 'active', 9);

-- Add new columns to agent_performance_entries for lead tracking and commission
ALTER TABLE agent_performance_entries
  ADD COLUMN IF NOT EXISTS leads_purchased INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_lead_cost NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comp_level_percent NUMERIC(5,2) DEFAULT 100,
  ADD COLUMN IF NOT EXISTS advancement_percent NUMERIC(5,2) DEFAULT 75,
  ADD COLUMN IF NOT EXISTS expected_issue_pay NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expected_deferred_pay NUMERIC(12,2) DEFAULT 0;

-- Add tracking columns to hierarchy_agents
ALTER TABLE hierarchy_agents
  ADD COLUMN IF NOT EXISTS total_lead_spend NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_profit NUMERIC(12,2) DEFAULT 0;

-- Update the trigger function to also calculate lead spend and net profit
CREATE OR REPLACE FUNCTION public.update_weekly_business()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      SELECT COALESCE(SUM(revenue), 0) - COALESCE(SUM(total_lead_cost), 0)
      FROM public.agent_performance_entries
      WHERE agent_id = NEW.agent_id
    ),
    last_business_date = NEW.entry_date,
    updated_at = now()
  WHERE user_id = NEW.agent_id;
  RETURN NEW;
END;
$$;