## Goal
Stop valid password-reset emails from landing on the “Invalid Reset Link” screen.

## What I’ll change
1. **Use the correct reset link format**
   - Update the password reset email function to send the direct `hashed_token` recovery URL format instead of relying on the generated one-time action link.
   - This avoids the backend verification URL being consumed before the app can establish the reset session.

2. **Make the reset page handle token URLs directly**
   - Teach `/reset-password` to detect `token_hash` + `type=recovery` in the query string.
   - Exchange that token in the app using the auth client, then show the “Set New Password” form.
   - Keep the existing fallback for hash-based recovery links and already-active sessions.

3. **Improve invalid-state timing**
   - Keep a loading/verification state while the token exchange runs.
   - Only show “Invalid Reset Link” after the token exchange fails or no valid reset markers/session exist.

4. **Verify the backend email sender**
   - Redeploy the password reset email function after the change.
   - Check recent function/auth logs to confirm new reset emails generate correctly.

## Files expected to change
- `supabase/functions/send-password-reset-email/index.ts`
- `src/pages/ResetPassword.tsx`

## Why this should fix it
The current email is using an action link that immediately hits the backend `/verify` endpoint. That link is one-time-use and can redirect before the React page is ready, which can still produce the invalid page. Using `token_hash` lets the app own the verification step on `/reset-password`, making the reset form much more reliable.