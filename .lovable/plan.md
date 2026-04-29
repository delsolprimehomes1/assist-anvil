## Plan: Reorder Auth Cards & Simplify CTA Copy

**File:** `src/pages/Auth.tsx`

### Changes

1. **Reorder the two cards** in the main column:
   - Move the "Onboarding Section" card (currently lines ~268–315) to appear **above** the Login/Sign Up auth card.
   - The Login/Sign Up card moves to the second position.
   - Logo/header stays at the top; footer text stays at the bottom.

2. **Remove the headline** in the onboarding card:
   - Delete the `<p>` containing **"Not onboarded yet as an agency?"** (the gradient Playfair Display line).
   - Keep **"Start your contracting process here 👇"** and the animated **"Request To Be Contracted"** button exactly as they are.

3. **Preserve everything else**:
   - All animations (`cardGlow`, `gradientShift`, `shimmer`) remain.
   - Playfair Display font import remains (still used by the second line).
   - Card spacing/padding unchanged.

Single file edit, no new dependencies.
