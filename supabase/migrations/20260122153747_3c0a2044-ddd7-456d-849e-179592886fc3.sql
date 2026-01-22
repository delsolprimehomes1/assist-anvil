-- Allow users to view profiles of agents in their downline
CREATE POLICY "Users can view downline profiles"
ON public.profiles
FOR SELECT
USING (
  -- Can view own profile
  auth.uid() = profiles.id
  OR
  -- Can view profiles of agents in their downline
  EXISTS (
    SELECT 1 FROM hierarchy_agents viewer
    JOIN hierarchy_agents target ON target.user_id = profiles.id
    WHERE viewer.user_id = auth.uid()
      AND target.path LIKE (viewer.path || '.%')
  )
);