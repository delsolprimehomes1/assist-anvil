# Fully Built Branded Password Reset — No Dashboard Config Needed

## The problem with the current setup

The existing `send-auth-email` edge function relies on Supabase's "Send Email" Auth Hook, which can only be toggled on in the Supabase dashboard — and Lovable Cloud doesn't expose that dashboard. So even though the function exists, it never fires.

## The fix: bypass the hook entirely

Build a custom edge function that generates a recovery link server-side using the admin API, then sends a branded email through Resend directly. No hook to enable, no dashboard step, fully working the moment it's deployed.

## Implementation

### 1. New edge function: `send-password-reset-email`
- Public endpoint (no JWT required — the email itself is the auth factor).
- Accepts `{ email }`.
- Uses `SUPABASE_SERVICE_ROLE_KEY` to call `supabase.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo: '<origin>/reset-password' } })`.
- If the email isn't a registered user, silently returns success (prevents email enumeration attacks).
- Sends a branded HTML email via Resend from `noreply@battersbox.com` with:
  - Navy header, BattersBox logo
  - Teal CTA button "Reset Your Password" → recovery link
  - Gold accent line, 1-hour expiry notice
  - Footer with support contact
- Rate-limited (simple in-memory map: 3 requests per email per 15 min) to prevent abuse.

### 2. Update `src/pages/Auth.tsx`
- Replace the current `supabase.auth.resetPasswordForEmail(...)` call in `handleSelfServeReset` with `supabase.functions.invoke('send-password-reset-email', { body: { email } })`.
- Everything else (hybrid dialog UI, admin fallback link) stays as already built.

### 3. `/reset-password` page — already works
- When the user clicks the link in the email, Supabase's recovery flow drops a session token in the URL hash.
- The existing `ResetPassword.tsx` page detects it and calls `supabase.auth.updateUser({ password })`. No changes needed.

### 4. Optional cleanup
- The old `send-auth-email` function becomes unused. Leave it in place (harmless) or delete it. I'll leave it for now in case you ever enable the hook for signup confirmations too.

## What you have to do

**Nothing.** No dashboard toggles, no secrets to add (`RESEND_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are already configured). Once I implement and deploy, click "Forgot password" → enter email → branded email arrives within seconds.

## Custom sender domain note

The function will send from `noreply@battersbox.com` (matches your other Resend emails). If you want `notify.battersbox.ai` instead, that just requires verifying that subdomain in your Resend dashboard and I swap one line — but `battersbox.com` is already verified there, so we can ship today and change later if you want.

## Files

- `supabase/functions/send-password-reset-email/index.ts` — new
- `supabase/config.toml` — add `[functions.send-password-reset-email] verify_jwt = false`
- `src/pages/Auth.tsx` — swap one function call

Ready to build?