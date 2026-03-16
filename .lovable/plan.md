

# Add "Existing User" Flow to Onboarding Form

## Problem
Existing BattersBox users who already have an account need to re-submit the onboarding form to trigger a GHL automation (licensing path). Currently the form forces them through Step 8 (password creation) and tries `supabase.auth.signUp`, which fails for duplicate emails. These users just need to fill out the form data and have it sent to the webhook — no account creation needed.

## How It Works

### 1. Detect existing email after Step 5 (email step)

When the user advances past the email step, check if that email already exists by calling a lightweight query or RPC. The simplest approach: attempt a password reset call (`supabase.auth.resetPasswordForEmail`) which succeeds silently for existing users, or query `onboarding_requests` / `agent_profiles` for a matching email. The most reliable method is to add a small edge function or database function that checks if an email exists in `auth.users` (since that table isn't directly queryable from the client).

**Chosen approach**: Create a simple database function (`check_email_exists`) that uses `SECURITY DEFINER` to check `auth.users` for the email. This runs server-side and returns a boolean.

### 2. Skip Step 8 (password) for existing users

Add a state variable `isExistingUser`. When detected:
- The `steps` array dynamically excludes the password step (7 steps instead of 8)
- The form schema switches to one without `password`/`confirmPassword` fields
- Step count and progress bar adjust automatically

### 3. Modified submit logic for existing users

When `isExistingUser` is true, the `onSubmit` function:
- Skips `supabase.auth.signUp` entirely
- Still inserts into `onboarding_requests` (without `user_id`, or with the existing user's ID from the DB function)
- Still calls the `send-onboarding-webhook` edge function with all form data
- Shows confetti and a success message like "Your information has been submitted!" instead of navigating to `/pending-approval`

### 4. Files to change

**New migration** — Create `check_email_exists` database function:
```sql
CREATE OR REPLACE FUNCTION public.check_email_exists(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = lower(check_email)
  );
$$;
```

**`src/components/auth/OnboardingDialog.tsx`** — Main changes:
- Add `isExistingUser` state (default `false`)
- After email step validation (step 5 → 6 transition), call `supabase.rpc('check_email_exists', { check_email: email })` to detect existing users
- Define two schemas: full schema (with password) and a reduced schema (without password/confirmPassword)
- Dynamically compute `steps` array: filter out step 8 when `isExistingUser` is true
- Update `onSubmit`: if `isExistingUser`, skip signUp, insert onboarding request without `user_id` (or look up the user_id from the function), call webhook, show success toast, close dialog (no redirect to pending-approval)
- Update progress bar denominator and step count text to reflect 7 vs 8 steps

**`supabase/functions/send-onboarding-webhook/index.ts`** — No changes needed (already accepts the same payload regardless of user status).

## What the User Experiences

**Existing user flow (7 steps)**:
```
Name → Referral → Agency Code → Manager → Email → Phone → Licensed? → ✅ Done
                                            ↑
                                    email detected as existing,
                                    password step silently removed
```

After submitting: confetti fires, toast says "Your information has been submitted!", dialog closes. No redirect. Data goes to GHL webhook.

**New user flow (8 steps)**: Unchanged — still includes password creation and account signup.

