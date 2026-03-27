

## Plan: Modernize CTA Text with Eye-Catching Font & Colors

**File:** `src/pages/Auth.tsx` (lines 289-290)

### Changes

**1. Import a distinctive Google Font**
- Add a `<link>` tag in `index.html` for **"Playfair Display"** (elegant serif that contrasts with the rest of the UI's sans-serif) — or use **"Outfit"** (modern geometric sans) for a cleaner but still distinct look
- Alternative: use inline `@import` in the `<style>` block already present in the component

**2. Restyle the two text lines (lines 289-290)**

- **"Not onboarded yet as an agency?"**
  - Apply the new font family via inline style
  - Use a **gradient text effect** (teal-to-gold) with `-webkit-background-clip: text` and `transparent` text color
  - Size: `text-xl md:text-2xl`, `font-black`, `tracking-tight`

- **"Start your contracting process here 👇"**
  - Same distinctive font
  - Lighter weight: `font-medium`
  - Color: solid gold (`#C98A3A`) instead of the current muted foreground
  - Size: `text-base md:text-lg`

**3. Implementation approach**
- Add `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap')` inside the existing `<style>` block
- Apply `fontFamily: "'Playfair Display', serif"` via inline `style` on both `<p>` tags
- Add gradient text CSS to the first line using inline styles

No new files or dependencies. Single file edit.

