## Why the page is glitching

The console shows `hierarchy_agents` UPDATE events firing roughly once per second on `/dashboard/organization`. Every one of those events triggers `fetchHierarchy()` in `useHierarchy`, which re-renders the whole Organization page (tree, licensing tab, skeletons flashing). That's the "glitch."

### Root cause — feedback loop introduced with the last-login fix

1. `useAuth` (in `src/hooks/useAuth.tsx`) now calls `update_my_last_login` whenever an auth event fires (`SIGNED_IN`, `TOKEN_REFRESHED`, or initial session) — and on every `useAuth` mount.
2. `useAuth` is consumed in **5+ places** simultaneously on this page: `ProtectedRoute`, `Header`, `useHierarchy`, `MyInvitationsList`, `AddAgentModal`. Each one creates its own `onAuthStateChange` subscription and its own `getSession()` call, so every auth tick fans out to N pings.
3. Each ping writes to `hierarchy_agents.last_login_at`.
4. `useHierarchy` subscribes to **all** `hierarchy_agents` UPDATE events with no filter, so every ping echoes back as a full refetch → setState → cascade re-render.
5. Re-renders cause `setUser(session?.user ?? null)` in each `useAuth` to install a fresh User object reference, which retriggers `useEffect([user])` consumers (notably `useHierarchy`'s subscription effect), tearing down and re-creating the realtime channel — and in some paths re-firing a ping. The system never settles.

The console confirms the loop: the same row (`11111111-1111…`) keeps getting `last_login_at` rewritten ~1×/sec with no user interaction.

## Fix

Two small, targeted changes.

### 1. Ping last-login at most once per page load — `src/hooks/useAuth.tsx`

- Move the "already pinged" flag to **module scope** (not per-hook-instance) so all 5 `useAuth` consumers share it.
- Only ping on the first `SIGNED_IN` of the session or the initial restored session. **Remove `TOKEN_REFRESHED`** from the trigger list (token refresh ≠ new login).
- Keep the `setTimeout(0)` defer so the auth callback isn't blocked.

Pseudocode:
```ts
let hasPingedThisLoad = false;
const pingOnce = () => {
  if (hasPingedThisLoad) return;
  hasPingedThisLoad = true;
  setTimeout(() => supabase.rpc("update_my_last_login"), 0);
};
```

### 2. Make the realtime subscription cheaper — `src/hooks/useHierarchy.ts`

- Debounce `fetchHierarchy()` calls from the realtime handler (e.g. 500ms trailing) so a burst of writes collapses into one refetch.
- This is defense-in-depth: even if some other column starts updating frequently in the future, the UI won't thrash.

No DB or RLS changes. No edit to `update_my_last_login` (it's still correct and safe — verified in the last turn).

## Verification

1. Reload `/dashboard/organization` and watch the preview console: `Hierarchy change detected` should fire **at most once** on load, then stop.
2. Confirm in DB: `SELECT last_login_at FROM hierarchy_agents WHERE user_id = auth.uid()` still updates on fresh sign-in.
3. Open a second browser tab, sign in there → first tab should refetch exactly once (realtime working), not 9× in 8 seconds.
4. Black-zone behavior remains correct: backdating `last_login_at` 8 days still flips the agent to Black.
