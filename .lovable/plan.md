## Current state

The **+ New Template** and **+ New Script** buttons in Sales Tools Center (`src/pages/Marketing.tsx`) are rendered unconditionally, so every logged-in user sees them, not just admins.

## Plan

1. In `src/pages/Marketing.tsx`, read the current user's admin status via the existing `useAdmin` hook.
2. Wrap the **+ New Template** button (Templates tab) and the **+ New Script** button (Scripts tab) so they only render when `isAdmin === true`.
3. Leave the rest of the tab content (search, listings, etc.) untouched so regular users still see and use templates/scripts — they just can't create new ones.
4. No backend or RLS changes; this is a UI-only gate. The underlying create actions are already admin-only at the data layer via existing policies.

## File to change
- `src/pages/Marketing.tsx`