## Add signup notification to admin@lifecoimo.com

There's already a `notify-admin-signup` edge function that emails admins when a new user signs up. It currently sends to all users with the `admin` role. We'll update it to also (or instead) send to `admin@lifecoimo.com`, and verify it's actually being triggered from the signup flow.

### Changes

1. **`supabase/functions/notify-admin-signup/index.ts`**
   - Add `admin@lifecoimo.com` as a guaranteed recipient (in addition to existing admin role emails, deduplicated).
   - Expand the email body to include all signup info the user provided (name, email, plus any extra metadata passed in the request: phone, agency, signup source, etc.).
   - Keep using Resend via `RESEND_API_KEY` (already configured) sending from `noreply@battersbox.ai` (verified domain).

2. **`src/pages/Auth.tsx` (signup handler)**
   - Verify the function is invoked after `supabase.auth.signUp(...)`. If not, add the `supabase.functions.invoke('notify-admin-signup', { body: { userName, userEmail, ...extra } })` call.
   - Pass through any additional signup fields the user filled in.

3. **Redeploy** the `notify-admin-signup` edge function.

### Open question

Do you want the email to go **only** to `admin@lifecoimo.com`, or to `admin@lifecoimo.com` **plus** all existing admin-role users? Default plan is "plus" (additive, deduplicated) — say the word if you want it locked to just that one address.

### Verify

Trigger a signup from the Auth page, confirm the email arrives at `admin@lifecoimo.com` with the new user's name, email, and any extra signup data.
