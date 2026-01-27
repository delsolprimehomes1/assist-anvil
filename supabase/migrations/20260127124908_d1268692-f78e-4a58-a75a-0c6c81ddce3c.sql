-- Part 1: Create new tables for Agent Performance Tracking System

-- 1. agent_performance_entries - Daily performance log entries
CREATE TABLE public.agent_performance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  lead_type TEXT NOT NULL,
  leads_worked INTEGER DEFAULT 0,
  dials_made INTEGER DEFAULT 0,
  appointments_set INTEGER DEFAULT 0,
  appointments_held INTEGER DEFAULT 0,
  clients_closed INTEGER DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  cost_per_lead NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. lead_products - Admin-configurable lead types
CREATE TABLE public.lead_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  min_quantity INTEGER DEFAULT 1,
  expected_conversion NUMERIC(5,2),
  badge TEXT,
  status TEXT DEFAULT 'active',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. agent_notes - Manager notes about agents
CREATE TABLE public.agent_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.hierarchy_agents(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. agent_rank_config - Rank thresholds and requirements
CREATE TABLE public.agent_rank_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL,
  min_ytd_premium NUMERIC(12,2) DEFAULT 0,
  min_agents_recruited INTEGER DEFAULT 0,
  comp_level_percentage NUMERIC(5,2),
  badge_color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Part 2: Add new columns to hierarchy_agents
ALTER TABLE public.hierarchy_agents ADD COLUMN IF NOT EXISTS comp_level NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.hierarchy_agents ADD COLUMN IF NOT EXISTS weekly_business_submitted NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.hierarchy_agents ADD COLUMN IF NOT EXISTS last_business_date DATE;

-- Part 3: Enable RLS on all new tables
ALTER TABLE public.agent_performance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_rank_config ENABLE ROW LEVEL SECURITY;

-- Part 4: RLS Policies for agent_performance_entries
-- Agents can view their own entries
CREATE POLICY "Users can view own performance entries"
  ON public.agent_performance_entries FOR SELECT
  USING (auth.uid() = agent_id);

-- Agents can insert their own entries
CREATE POLICY "Users can insert own performance entries"
  ON public.agent_performance_entries FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

-- Agents can update their own entries
CREATE POLICY "Users can update own performance entries"
  ON public.agent_performance_entries FOR UPDATE
  USING (auth.uid() = agent_id);

-- Agents can delete their own entries
CREATE POLICY "Users can delete own performance entries"
  ON public.agent_performance_entries FOR DELETE
  USING (auth.uid() = agent_id);

-- Managers can view downline performance (using path matching)
CREATE POLICY "Managers can view downline performance"
  ON public.agent_performance_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hierarchy_agents viewer
      JOIN public.hierarchy_agents target ON target.user_id = agent_performance_entries.agent_id
      WHERE viewer.user_id = auth.uid()
      AND target.path LIKE (viewer.path || '.%')
    )
  );

-- Admins can manage all performance entries
CREATE POLICY "Admins can manage all performance entries"
  ON public.agent_performance_entries FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Part 5: RLS Policies for lead_products
-- All authenticated users can read active lead products
CREATE POLICY "Authenticated users can view active lead products"
  ON public.lead_products FOR SELECT
  USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

-- Only admins can manage lead products
CREATE POLICY "Admins can manage lead products"
  ON public.lead_products FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Part 6: RLS Policies for agent_notes
-- Users can view notes about agents in their downline
CREATE POLICY "Users can view notes for downline agents"
  ON public.agent_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hierarchy_agents viewer
      JOIN public.hierarchy_agents target ON target.id = agent_notes.agent_id
      WHERE viewer.user_id = auth.uid()
      AND (target.path LIKE (viewer.path || '.%') OR target.user_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- Users can create notes for agents in their downline
CREATE POLICY "Users can create notes for downline agents"
  ON public.agent_notes FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND (
      EXISTS (
        SELECT 1 FROM public.hierarchy_agents viewer
        JOIN public.hierarchy_agents target ON target.id = agent_notes.agent_id
        WHERE viewer.user_id = auth.uid()
        AND target.path LIKE (viewer.path || '.%')
      )
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Users can update their own notes
CREATE POLICY "Users can update own notes"
  ON public.agent_notes FOR UPDATE
  USING (auth.uid() = created_by);

-- Users can delete their own notes
CREATE POLICY "Users can delete own notes"
  ON public.agent_notes FOR DELETE
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- Part 7: RLS Policies for agent_rank_config
-- All authenticated users can view rank config
CREATE POLICY "Authenticated users can view rank config"
  ON public.agent_rank_config FOR SELECT
  USING (true);

-- Only admins can manage rank config
CREATE POLICY "Admins can manage rank config"
  ON public.agent_rank_config FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Part 8: Create trigger function to update weekly business
CREATE OR REPLACE FUNCTION public.update_weekly_business()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.hierarchy_agents
  SET weekly_business_submitted = (
    SELECT COALESCE(SUM(revenue), 0)
    FROM public.agent_performance_entries
    WHERE agent_id = NEW.agent_id
    AND entry_date >= date_trunc('week', CURRENT_DATE)
  ),
  last_business_date = NEW.entry_date,
  updated_at = now()
  WHERE user_id = NEW.agent_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on agent_performance_entries
CREATE TRIGGER on_performance_entry_change
  AFTER INSERT OR UPDATE ON public.agent_performance_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_weekly_business();

-- Part 9: Create updated_at trigger for new tables
CREATE TRIGGER update_agent_performance_entries_updated_at
  BEFORE UPDATE ON public.agent_performance_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_products_updated_at
  BEFORE UPDATE ON public.lead_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_notes_updated_at
  BEFORE UPDATE ON public.agent_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Part 10: Enable realtime for performance entries
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_performance_entries;

-- Part 11: Insert default rank configurations
INSERT INTO public.agent_rank_config (rank_name, display_order, min_ytd_premium, min_agents_recruited, comp_level_percentage, badge_color)
VALUES 
  ('New Agent', 1, 0, 0, 50.00, '#3b82f6'),
  ('Producer', 2, 25000, 0, 65.00, '#8b5cf6'),
  ('Power Producer', 3, 75000, 2, 80.00, '#f97316'),
  ('Director', 4, 150000, 5, 90.00, '#eab308'),
  ('Elite Director', 5, 300000, 10, 100.00, '#22c55e');