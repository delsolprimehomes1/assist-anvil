## Fix: Use verified `battersbox.ai` domain for Resend

The forgot-password email failed because Resend rejected sends from `noreply@battersbox.com` (unverified). Your verified domain is `battersbox.ai`.

### Changes
Update the `from` address in all three edge functions that send via Resend:

1. `supabase/functions/send-password-reset-email/index.ts` — `noreply@battersbox.com` → `noreply@battersbox.ai`
2. `supabase/functions/notify-admin-signup/index.ts` — same swap
3. `supabase/functions/notify-user-approved/index.ts` — same swap

### Deploy
Redeploy all three functions so the change takes effect.

### Verify
Trigger "Forgot password" from the Auth page, confirm the branded email arrives and the reset link drops on `/reset-password`.

No DB changes, no secrets needed.