

## Plan: Add Email Confirmation Modal After New User Onboarding Submission

**File:** `src/components/auth/OnboardingDialog.tsx`

### Changes

**1. Add state for showing the email confirmation modal**
- Add `const [showEmailConfirm, setShowEmailConfirm] = useState(false)` alongside existing state variables.

**2. Update the new-user submission success path (lines 342-345)**
- Instead of immediately closing the dialog and navigating to `/pending-approval`, show the email confirmation modal first:
  - Keep `fireBrandConfetti()`
  - Replace `toast.success(...)` + `onOpenChange(false)` + `navigate(...)` with `setShowEmailConfirm(true)`

**3. Add the email confirmation overlay inside the Dialog**
- When `showEmailConfirm` is true, render a smooth animated overlay inside the existing `DialogContent` with:
  - A mail/inbox icon (using `Mail` from lucide)
  - Heading: "You're almost there!"
  - Body text explaining they'll receive an email with instructions to complete contracting, and to check spam/junk folders
  - Modern, friendly tone
  - A "Got it" button that closes the dialog and navigates to `/pending-approval`
  - Uses `motion.div` for a smooth fade/scale entrance animation
  - Styled with the brand teal color accents for consistency

**4. No new dependencies** -- uses existing `Mail` icon import, `framer-motion`, and brand colors already in the file.

