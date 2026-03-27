

## Plan: Animated Attention-Grabbing Arrows for "Request to be Contracted"

### What Changes

**File:** `src/pages/Auth.tsx` (lines 267-278, the Onboarding Section card)

Wrap the existing card in a `relative` container and add two animated arrow elements — one on each side — that orbit/pulse and then point inward toward the button. The animation will loop continuously.

### Design

- Two SVG curved arrows (left and right) positioned absolutely on either side of the card
- CSS keyframe animation: arrows float in a subtle circular orbit, then sweep inward pointing at the button, pause briefly, then restart
- Arrows use the brand teal color (`#8BBAC4`) with a subtle glow effect
- Also add a soft pulsing glow/border animation on the card itself to reinforce attention
- Enhance the text slightly: make "Not onboarded yet as an agency?" bolder/larger
- All done with Tailwind + inline CSS keyframes via a `<style>` tag or framer-motion (already imported)

### Implementation

1. Add a `<style>` block with custom `@keyframes` for the orbiting arrow animation (orbit outward, sweep inward, pause, repeat — ~3s cycle)
2. Add two `motion.div` arrow containers (left + right) with the animated SVG arrows, positioned absolutely beside the card
3. Add a subtle pulse animation to the card border (teal glow that fades in/out)
4. Bump the "Not onboarded yet" text styling slightly for visibility

Single file change, no new dependencies.

