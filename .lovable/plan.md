## Goal
Give admins a one-click way to flip `hierarchy_agents.verification_complete`, with a proper audit trail, so agents can leave the Blue Onboarding zone.

## Placement note
The user mentioned `HierarchyPlacementModal`, but that modal is only a bulk move-agent tool — it has no per-agent admin actions. The natural home is the **Licensing tab's agent row in `LicensingCommandCenter.tsx`** (line ~287), which already renders the "Verification: Complete / Pending" badge for each agent. That's where the admin toggle belongs.

If you'd rather have it inside `HierarchyPlacementModal` or on the flippable card back, say so and I'll move it.

## Migration (schema + RPC)

```sql
-- 1. Audit columns
ALTER TABLE public.hierarchy_agents
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Admin-only RPC
CREATE OR REPLACE FUNCTION public.set_agent_verification(
  target_user_id uuid,
  is_verified boolean
)
RETURNS public.hierarchy_agents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_row public.hierarchy_agents;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change verification status';
  END IF;

  UPDATE public.hierarchy_agents
  SET
    verification_complete = is_verified,
    verified_at = CASE WHEN is_verified THEN now() ELSE NULL END,
    verified_by = CASE WHEN is_verified THEN auth.uid() ELSE NULL END,
    updated_at = now()
  WHERE user_id = target_user_id
  RETURNING * INTO updated_row;

  IF updated_row IS NULL THEN
    RAISE EXCEPTION 'Agent % not found', target_user_id;
  END IF;

  RETURN updated_row;
END;
$$;

REVOKE ALL ON FUNCTION public.set_agent_verification(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_agent_verification(uuid, boolean) TO authenticated;
```

Admin enforcement is enforced inside the function via `has_role()`, so a non-admin calling the RPC directly gets a clean exception.

## Frontend changes

**`src/components/hierarchy/LicensingCommandCenter.tsx`**
- Import `useAdmin` and `supabase`.
- Add a small `<Button>` next to the Verification badge, only rendered when `isAdmin`:
  - Label: "Mark Verified" when `!agent.verificationComplete`, "Unverify" otherwise.
  - On click: `supabase.rpc('set_agent_verification', { target_user_id: agent.userId, is_verified: !agent.verificationComplete })`.
  - Show toast on success/error. No manual refetch — `useHierarchy` realtime sub picks up the row update.
  - Disable while in-flight (track a `pendingId` state).

No other UI surfaces need changes.

## Verification
1. SQL check on enum/migration applied; columns exist on `hierarchy_agents`.
2. Sign in as admin → Licensing tab → click "Mark Verified" on a pending agent → badge flips within ~1s via realtime.
3. `SELECT verification_complete, verified_at, verified_by FROM hierarchy_agents WHERE user_id = '<id>'` confirms values set.
4. Click "Unverify" → values clear back to false / NULL / NULL.
5. As a non-admin: button is hidden; calling the RPC manually returns "Only admins can change verification status".

## Files touched
- New migration under `supabase/migrations/`
- `src/components/hierarchy/LicensingCommandCenter.tsx`
