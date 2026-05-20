# Hybrid Password Reset with Branded Resend Email

Yes — all three are compatible. You already use Resend for admin notifications, so we just extend that setup with a Supabase Auth email hook that routes the password reset email through Resend from your custom domain.

## What you'll get

1. **Self-serve reset (primary):** User clicks "Forgot password" → enters email → receives a branded BattersBox email from your domain with a reset link → clicks link → lands on `/reset-password` → sets new password → signs in immediately.
2. **Admin-assisted reset (fallback):** A smaller "Need help? Request an admin reset" link stays below the main flow for users who can't receive email or are locked out.
3. **Branded email:** Sent from something like `support@notify.battersbox.ai`, with BattersBox logo, navy/teal/gold styling, and your tone — not a generic Supabase template.

## Implementation steps

### 1. Custom sender domain (one-time)
- You choose a subdomain (recommended: `notify.battersbox.ai`).
- A setup dialog opens where you add 3-4 DNS records (SPF, DKIM, MX, NS) at your domain registrar for `battersbox.ai`.
- DNS propagates (minutes to ~72h). Sending activates automatically once verified — no code wait needed.

### 2. Branded auth email templates (Resend-powered)
- Scaffold a Supabase Auth Email Hook (`auth-email-hook` Edge Function) that intercepts password reset events and sends through Resend using your existing `RESEND_API_KEY`.
- Create a React Email template for the recovery email with:
  - BattersBox logo at top
  - Navy header, white body, teal CTA button "Reset your password"
  - Playfair heading, body copy in your standard font
  - Gold accent line, footer with support contact
- The hook also handles signup confirmation and magic link emails so everything is on-brand.

### 3. Frontend changes (`src/pages/Auth.tsx`)
- Replace the current "Forgot password?" dialog's submit handler:
  - Primary action: call `supabase.auth.resetPasswordForEmail(email, { redirectTo: '<origin>/reset-password' })`
  - Show success toast: "Check your email for a reset link"
  - Secondary link underneath: "Can't access email? Request admin reset" → opens the existing admin-request flow as fallback

### 4. New `/reset-password` page
- Public route (not gated by auth).
- Detects Supabase recovery token in URL hash on mount.
- Form: new password + confirm password, with strength indicator.
- Calls `supabase.auth.updateUser({ password })`.
- On success: toast + redirect to `/dashboard` (user is auto-signed-in from the recovery session).
- Handles expired/invalid token with a clear error and a "Request a new link" button.

### 5. Keep admin-assisted flow intact
- `password_reset_requests` table and the admin dashboard utility stay as-is.
- The existing memory rule "Admin-assisted password resets" is updated to "Self-serve primary, admin fallback."

## Technical notes

- **Resend on custom domain:** Resend verifies the domain via the same DNS records used for the custom sender — one setup covers it.
- **No extra secrets needed:** `RESEND_API_KEY` is already configured.
- **Email hook auth:** The hook uses `SEND_EMAIL_HOOK_SECRET` (auto-managed) so Supabase Auth can authenticate calls to your function.
- **Token validity:** Supabase recovery tokens expire in 1 hour by default — fine for this use case.
- **No DB migrations** required for the reset flow itself; `password_reset_requests` stays for the admin fallback.

## Files changed

- `src/pages/Auth.tsx` — swap forgot-password handler to self-serve, add fallback link
- `src/pages/ResetPassword.tsx` — new
- `src/App.tsx` — add `/reset-password` route
- `supabase/functions/auth-email-hook/index.ts` — new
- `supabase/functions/_shared/email-templates/recovery.tsx` — new (branded)
- Plus signup, magic-link templates for consistency
- DNS records added at your registrar (one-time, you handle in dialog)

## What I need from you to start

Just confirm the sender subdomain you want — I recommend `notify.battersbox.ai`. Then I'll kick off the domain setup dialog and build everything else in the same pass.