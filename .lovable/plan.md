## Why you’re seeing “Auth session missing”

The reset link is getting verified, so the form appears. But when you tap **Update Password**, the browser sometimes does not have a persisted auth session yet. `updateUser({ password })` requires that session, so the auth client returns **Auth session missing**.

This is a known fragile part of recovery-token flows: `verifyOtp` can succeed but the temporary recovery session may not be available to the password update call, especially on mobile/in-app browsers.

## Plan

1. **Move the final password update to the backend**
   - Keep `/reset-password?token_hash=...&type=recovery` as the reset URL.
   - Do not rely on the mobile browser holding a temporary recovery session.
   - Add a secure backend function that receives `token_hash`, `newPassword`, and `type: recovery`.
   - The function verifies the recovery token server-side, identifies the user, updates that user’s password, and returns success.

2. **Update `/reset-password` page state**
   - Store the `token_hash` from the URL in component state.
   - Show the reset form when the link contains a valid-looking recovery token, without consuming it immediately on page load.
   - On submit, call the backend function with the token and new password.
   - Only show an invalid/expired message if the backend function says the token is invalid or expired.

3. **Preserve fallback behavior**
   - Keep support for existing hash/session recovery links for older emails already sent.
   - If there is no `token_hash`, continue using the current session-based `updateUser` fallback.

4. **Clean up the user experience**
   - Replace the raw “Auth session missing!” toast with clearer copy like “This reset link expired or was already used. Please request a new one.”
   - After a successful reset, sign out any temporary session and send the user back to login.

## Files to change

- `src/pages/ResetPassword.tsx`
- Add a new backend function, likely `supabase/functions/complete-password-reset/index.ts`

## Expected result

The reset flow will no longer depend on Safari/Gmail/in-app browser session persistence, so clicking the link once and submitting a new password should work reliably.