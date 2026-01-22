-- Allow authenticated users to create invitations for their own downline
CREATE POLICY "Users can create their own invitations"
ON public.user_invitations
FOR INSERT
TO authenticated
WITH CHECK (invited_by = auth.uid());

-- Users can update their own pending invitations
CREATE POLICY "Users can update their own invitations"
ON public.user_invitations
FOR UPDATE
TO authenticated
USING (invited_by = auth.uid())
WITH CHECK (invited_by = auth.uid());

-- Users can delete their own pending invitations
CREATE POLICY "Users can delete their own invitations"
ON public.user_invitations
FOR DELETE
TO authenticated
USING (invited_by = auth.uid());

-- Users can view invitations they created
CREATE POLICY "Users can view their own invitations"
ON public.user_invitations
FOR SELECT
TO authenticated
USING (invited_by = auth.uid());