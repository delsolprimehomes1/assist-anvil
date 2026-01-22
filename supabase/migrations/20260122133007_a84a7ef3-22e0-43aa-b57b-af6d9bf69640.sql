-- Drop the problematic policies first
DROP POLICY IF EXISTS "Users can view their downline" ON hierarchy_agents;
DROP POLICY IF EXISTS "Users can view own hierarchy record" ON hierarchy_agents;
DROP POLICY IF EXISTS "Admins can manage all hierarchy agents" ON hierarchy_agents;

-- Create a security definer function to check hierarchy access (bypasses RLS)
CREATE OR REPLACE FUNCTION public.can_view_hierarchy_agent(_viewer_id uuid, _agent_user_id uuid, _agent_path text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- User can view their own record
    _viewer_id = _agent_user_id
    OR
    -- User can view their downline (agent's path starts with viewer's path)
    EXISTS (
      SELECT 1 FROM hierarchy_agents ha
      WHERE ha.user_id = _viewer_id
        AND _agent_path LIKE (ha.path || '.%')
    )
$$;

-- Create new non-recursive policies
CREATE POLICY "Admins can manage all hierarchy agents"
ON hierarchy_agents FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view accessible hierarchy records"
ON hierarchy_agents FOR SELECT
USING (
  can_view_hierarchy_agent(auth.uid(), user_id, path)
);

-- Allow users to insert their own downline records
CREATE POLICY "Users can insert to their downline"
ON hierarchy_agents FOR INSERT
WITH CHECK (
  -- The parent must be the current user's hierarchy record
  EXISTS (
    SELECT 1 FROM hierarchy_agents ha
    WHERE ha.user_id = auth.uid()
      AND hierarchy_agents.parent_id = ha.id
  )
  OR
  -- Or user is creating their own record (no parent)
  (parent_id IS NULL AND user_id = auth.uid())
);