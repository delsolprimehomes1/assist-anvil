# Remove license detail fields from signup "Are you licensed?" step

## What the request means
The person wants the six license-detail questions removed from the signup step "Are you licensed?" (Step 7 of 7). These show after tapping "Yes":
1. Resident license expiration
2. Resident state (the dropdown that won't scroll on some phones)
3. License number
4. NPN number
5. CE due date
6. Other states you're licensed in

Removing them also removes the scrolling problem.

## What stays
- The Yes / No "Are you licensed?" choice stays and is still required and saved.
- Back and Submit Request buttons stay.

## What changes
- After tapping Yes or No, no extra fields appear; the user can submit right away.
- The six fields are no longer required or sent with the signup.
- Past answers already saved stay untouched; the Compliance page and admin views keep working (they'll just be empty for new signups, and agents can still fill license info later in Compliance).

## Technical details
- `src/components/auth/OnboardingDialog.tsx`: remove the six fields from the schema, `licensedRefine`, step 7 `fields`, default values, JSX block under `isLicensed === "yes"`, and the submit payload (send nulls / omit).
- No database changes.
