-- Add new columns to hierarchy_agents for zone logic
ALTER TABLE hierarchy_agents 
ADD COLUMN IF NOT EXISTS verification_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contracts_pending INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS contracts_approved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS resident_license_exp DATE,
ADD COLUMN IF NOT EXISTS ce_due_date DATE;

-- Enable realtime for hierarchy_agents
ALTER PUBLICATION supabase_realtime ADD TABLE hierarchy_agents;