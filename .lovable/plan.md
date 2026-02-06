
# Remove Lead Capture Form and Redirect to Auth

This plan simplifies the landing page by removing the lead capture form and making the "Get Started" button redirect directly to the authentication page.

---

## Changes Overview

| File | Action |
|------|--------|
| `src/pages/LandingPage.tsx` | Remove the `LeadCaptureForm` import and component |
| `src/components/landing/HeroSection.tsx` | Change "Get Started" button to navigate to `/auth` |

---

## Implementation Details

### 1. Update HeroSection.tsx

Replace the scroll-to-form behavior with navigation to the auth page:

**Before:**
- Uses `scrollToForm()` function to scroll to `#contact` section
- ArrowDown icon implies scrolling down

**After:**
- Uses `useNavigate()` from react-router-dom to redirect to `/auth`
- Change icon to ArrowRight to imply navigation forward

```tsx
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    // ...
    <Button
      size="lg"
      onClick={() => navigate("/auth")}
      className="..."
    >
      Get Started
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
    // ...
  );
};
```

### 2. Update LandingPage.tsx

Remove the LeadCaptureForm component entirely:

**Before:**
```tsx
import { LeadCaptureForm } from "@/components/landing/LeadCaptureForm";

// In render:
<LeadCaptureForm />
```

**After:**
```tsx
// Remove the import
// Remove the component from render
```

---

## Note on LeadCaptureForm.tsx

The `LeadCaptureForm.tsx` file and `lead_captures` database table will remain in place but unused. This is intentional:

- The file can be deleted later if you're sure you won't need it
- The database table preserves any existing lead data
- If you want to re-enable lead capture in the future, it's ready to go

---

## Summary

- The landing page will no longer have the "Connect With BattersBox" form section
- Clicking "Get Started" will take users directly to the sign-in/sign-up page
- This creates a cleaner, more direct user flow for agents ready to authenticate
