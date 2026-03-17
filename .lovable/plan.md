

## Plan: Add Email Check Messaging to Pending Approval Page

The email confirmation overlay was added to the OnboardingDialog, but once users land on `/pending-approval`, that dialog is gone. The PendingApproval page itself needs to carry that messaging.

**File:** `src/pages/PendingApproval.tsx`

### Changes

**1. Update the page copy to include email/contracting instructions**
- Replace the current generic "Our admin team is reviewing your application" text with messaging that tells users to check their email (and spam/junk) for contracting instructions
- Add a visible callout section (e.g., teal-accented box with a Mail icon) emphasizing:
  - "Check your inbox for an email with instructions to complete your contracting"
  - "Don't see it? Be sure to check your spam or junk folder just in case"
- Keep the existing "you'll receive an email notification once approved" note but reword to fit the new flow
- Maintain the support contact and sign-out button

**2. Modernize the tone**
- Use friendly, conversational language consistent with the onboarding modal ("You're almost there!", etc.)
- Keep it clean and informational, matching the brand teal accent color

Single file change, no new dependencies.

