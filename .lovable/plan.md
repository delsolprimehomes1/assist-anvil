

## Plan: Enhance "Request to be Contracted" Card Visibility

**File:** `src/pages/Auth.tsx` (lines 267–311)

### Changes

**1. Add animated gradient box-shadow to the card**
- Replace the current `tealGlow` keyframe with a more dramatic animated glow that alternates between teal and gold shadows
- Larger spread radius (up to 30-40px) so the glow is unmissable
- New keyframe name: `cardGlow` cycling through teal → gold → teal shadow colors

**2. Bold up the text styling**
- "Not onboarded yet as an agency?" → `text-lg md:text-xl font-extrabold tracking-tight`
- "Start your contracting process here 👇" → `text-sm md:text-base font-semibold text-foreground/70` (promoted from `text-xs text-muted-foreground`)

**3. Mobile optimization**
- Card padding: `pt-5 pb-5 px-4` on mobile, slightly more on desktop
- Button height: `h-12` with `text-base md:text-lg` for large touch target
- Text sizes scale responsively with `md:` breakpoints
- Spacing between elements adjusted for compact mobile view

Single file, no new dependencies.

