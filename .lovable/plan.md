

## Plan: Fix Sign-Up Flow Messaging + Admin/User Email Automations

### Problem
Both the regular **Sign Up** and **Request to be Contracted** flows land users on the same `PendingApproval` page, which shows contracting-specific messaging ("Check your email to finish contracting"). Regular sign-up users are already contracted — they just need portal access approval.

### Solution Overview
1. Differentiate the two user types so the PendingApproval page shows the right message
2. Show a celebratory modal with confetti on regular sign-up completion
3. Send an email to admins when someone signs up
4. Send an email to the user when an admin approves them

---

### Changes

**1. Add `signup_source` column to profiles table**

Migration to add `signup_source TEXT DEFAULT 'direct'` to profiles. Values: `'direct'` (regular sign-up) or `'onboarding'` (Request to be Contracted). Update the existing trigger or add logic so:
- Regular sign-up sets `signup_source = 'direct'` (default)
- Onboarding flow sets `signup_source = 'onboarding'`

**2. Update OnboardingDialog to set `signup_source = 'onboarding'`**

File: `src/components/auth/OnboardingDialog.tsx`
- After creating the user, update their profile to set `signup_source = 'onboarding'`

**3. Add celebration modal to Auth.tsx sign-up success**

File: `src/pages/Auth.tsx`
- On successful sign-up, show a modal with confetti (reuse the `fireBrandConfetti` pattern from OnboardingDialog)
- Message: "You're in! 🎉 Your sign-up is complete. The BattersBox team is reviewing your access — you'll be notified once you're approved."
- "Got it" button signs them in and navigates to `/pending-approval`

**4. Update PendingApproval page to show different messages**

File: `src/pages/PendingApproval.tsx`
- Fetch `signup_source` from the profile
- If `signup_source = 'onboarding'`: show current contracting messaging (check email, etc.)
- If `signup_source = 'direct'`: show approval-waiting messaging — "Your portal access is being reviewed by the BattersBox team. We'll let you know as soon as you're approved!"
- No mention of contracting or checking email for direct sign-ups

**5. Create `notify-admin-signup` edge function**

New file: `supabase/functions/notify-admin-signup/index.ts`
- Accepts `{ userName, userEmail }` payload
- Queries `user_roles` table for all admin user IDs, then fetches their emails from profiles
- Sends email via Resend to all admins: "New sign-up: [Name] ([email]) is waiting for portal access approval"
- Called from Auth.tsx after successful sign-up

**6. Create `notify-user-approved` edge function**

New file: `supabase/functions/notify-user-approved/index.ts`
- Accepts `{ userId, userName, userEmail }` payload
- Sends email via Resend to the user: "Great news! Your BattersBox portal access has been approved. Log in now."
- Called from `PendingUsersList.tsx` when admin clicks "Approve"

**7. Wire up the email calls**

- `src/pages/Auth.tsx`: After successful sign-up, invoke `notify-admin-signup`
- `src/components/admin/PendingUsersList.tsx`: After successful approval mutation, invoke `notify-user-approved`

---

### Technical Details

- Both new edge functions use the existing `RESEND_API_KEY` secret (already configured)
- Sender: `noreply@battersbox.com` (or whatever domain is configured in Resend)
- Confetti uses the existing brand colors (teal `#8BBAC4`, gold `#C98A3A`) and `canvas-confetti` already in the project
- No new dependencies needed

### Files Changed/Created
- New migration (add `signup_source` column)
- `src/pages/Auth.tsx` — celebration modal + admin notification call
- `src/pages/PendingApproval.tsx` — conditional messaging
- `src/components/auth/OnboardingDialog.tsx` — set signup_source
- `src/components/admin/PendingUsersList.tsx` — approval email call
- `supabase/functions/notify-admin-signup/index.ts` (new)
- `supabase/functions/notify-user-approved/index.ts` (new)

