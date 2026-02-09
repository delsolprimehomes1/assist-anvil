
# Update Agency Code & Manager Selection System

Updates the onboarding form's agency codes and manager names in `src/components/auth/OnboardingDialog.tsx`.

---

## Changes (Single File)

**File:** `src/components/auth/OnboardingDialog.tsx`

### 1. Update AGENCY_MANAGER_MAP (lines 123-130)

Replace the current map with updated names and new codes:

```typescript
const AGENCY_MANAGER_MAP: Record<string, string[]> = {
  "100": ["K. Jenson", "E. Young Smith"],       // unchanged
  "200": ["Chepe G."],                           // was "C. Gutierrez"
  "300": ["Leah G."],                            // was "L. Gause"
  "400": ["J. Meletia"],                         // unchanged
  "500": ["Aaron C."],                           // was "A. Coleman"
  "600": ["Tara H."],                            // was "T. Hunt"
  "700": ["Eric H."],                            // new
  "800": ["Adrian E."],                          // new
  "900": ["M. Jaramillo"],                       // new
  "1000": ["R. Pitterman"],                      // new
  "1500": ["Jason L."],                          // new
};
```

### 2. Update Agency Code Dropdown Options (line 594)

Change the array from `["100", "200", "300", "400", "500", "600"]` to include all codes:

```typescript
["100", "200", "300", "400", "500", "600", "700", "800", "900", "1000", "1500"]
```

---

## Summary

- Agency codes 100 and 400 keep their current format (First Initial. Last Name)
- Codes 200, 300, 500, 600 switch to "Full First Name Last Initial." format
- Five new agency codes added: 700, 800, 900, 1000, 1500
- No database migration needed -- the agency code is stored as a free-text string
- No other files need changes
