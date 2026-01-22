-- Create hierarchy_agents table for storing agent hierarchy relationships
CREATE TABLE public.hierarchy_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.hierarchy_agents(id) ON DELETE SET NULL,
  path TEXT NOT NULL,
  depth INTEGER DEFAULT 0,
  
  -- Status and tier
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  tier TEXT DEFAULT 'new_agent' CHECK (tier IN ('new_agent', 'producer', 'power_producer', 'elite')),
  
  -- Performance metrics
  monthly_goal DECIMAL(12,2) DEFAULT 10000,
  ytd_premium DECIMAL(12,2) DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  
  -- License info (denormalized for performance)
  license_states TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.hierarchy_agents ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all hierarchy records
CREATE POLICY "Admins can manage all hierarchy agents"
ON public.hierarchy_agents
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Users can view their own record
CREATE POLICY "Users can view own hierarchy record"
ON public.hierarchy_agents
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Users can view their entire downline (agents whose path starts with their path)
CREATE POLICY "Users can view their downline"
ON public.hierarchy_agents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.hierarchy_agents ha
    WHERE ha.user_id = auth.uid()
    AND public.hierarchy_agents.path LIKE ha.path || '.%'
  )
);

-- Create indexes for efficient queries
CREATE INDEX idx_hierarchy_agents_path ON public.hierarchy_agents USING btree (path);
CREATE INDEX idx_hierarchy_agents_parent ON public.hierarchy_agents (parent_id);
CREATE INDEX idx_hierarchy_agents_user ON public.hierarchy_agents (user_id);
CREATE INDEX idx_hierarchy_agents_status ON public.hierarchy_agents (status);
CREATE INDEX idx_hierarchy_agents_tier ON public.hierarchy_agents (tier);

-- Create trigger for updated_at
CREATE TRIGGER update_hierarchy_agents_updated_at
BEFORE UPDATE ON public.hierarchy_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();