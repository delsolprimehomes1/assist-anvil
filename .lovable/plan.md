

## Plan: Remove Ugly Arrows, Make CTA Button Pop

**File:** `src/pages/Auth.tsx` (lines 267–349)

### Changes

**1. Remove the SVG arrows entirely**
- Delete the `arrowOrbitLeft` and `arrowOrbitRight` keyframes and the two arrow `<div>` elements (lines 287–334)
- Keep the `tealGlow` keyframe for the card pulse

**2. Make the "Request To Be Contracted" button eye-catching**
- Replace the plain `variant="outline"` with an animated gradient button
- Background: animated gradient shifting between teal (`#8BBAC4`) and gold (`#C98A3A`)
- White text, bold, with a subtle shimmer/shine sweep animation across the surface
- Add a new CSS keyframe `gradientShift` that slowly rotates the gradient angle, and `shimmer` that sweeps a white highlight across the button
- This makes the button visually distinct and impossible to miss without needing external arrows

**3. Keep the card glow**
- The pulsing teal border glow stays as-is — it works well

### Result
- No more confusing SVG shapes
- The CTA button itself becomes the attention-grabber with animated color and a shimmer effect
- Clean, modern, professional look

