## Signup Page Enhancements

Add two new required fields to the Sign Up form on `/auth` and ensure every field must be filled before the form can submit.

### Changes to `src/pages/Auth.tsx`

**New state:**
- `phone` (string)
- `agencyName` (string)

**New form fields in the Sign Up tab**, inserted in this order:
1. Full Name (existing)
2. Email Address (existing)
3. **Phone Number** — `type="tel"`, required, placeholder `(555) 123-4567`
4. **Agency Name** — `type="text"`, required, placeholder `Acme Insurance Agency`
5. Password (existing)

**Validation:**
- All inputs use the native `required` attribute so the browser blocks submission when empty.
- Add a `.trim()` guard in `handleSignUp` that toasts "All fields are required" if any value is empty after trimming (catches whitespace-only entries).
- Keep the existing 6-character minimum on password.

**Persist the new values:**
Pass `phone` and `agency_name` into Supabase signup metadata:
```ts
supabase.auth.signUp({
  email, password,
  options: {
    emailRedirectTo: ...,
    data: { full_name: fullName, phone, agency_name: agencyName }
  }
})
```
These land in `auth.users.raw_user_meta_data` and are available to the admin notification email and the `handle_new_user` trigger for future use.

**Reset state after success:** clear `phone` and `agencyName` along with the existing fields.

### Not in scope
- No DB schema changes. Phone and agency name are captured into auth metadata only — if you later want them queryable on the `profiles` table or copied into `agent_profiles` on signup, that's a separate small migration we can do after.
- No changes to the "Request To Be Contracted" onboarding dialog (that's a separate, more detailed flow and already collects these fields).
- No changes to login or password-reset forms.

### Verification
- Try to submit the Sign Up form with any field empty → browser blocks it.
- Submit with all fields filled → account created, success modal appears, admin notification fires.
