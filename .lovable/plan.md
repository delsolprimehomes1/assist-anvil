
# Reorder Onboarding Steps

Rearranges the onboarding form steps in `src/components/auth/OnboardingDialog.tsx`.

---

## New Step Order

| Step | Content | Was Step |
|------|---------|----------|
| 1 | Name (first + last) | 1 (unchanged) |
| 2 | Who referred you? | 7 |
| 3 | Select your agency code | 5 |
| 4 | Select your manager | 6 |
| 5 | What's your email address? | 2 |
| 6 | What's your phone number? | 3 |
| 7 | Are you licensed? | 4 |
| 8 | Create a secure password | 8 (unchanged) |

---

## Technical Details

**Single file change:** `src/components/auth/OnboardingDialog.tsx`

### 1. Reorder the `steps` array (lines 160-209)

Move the step objects into the new order. The `id` values will be renumbered 1-8 sequentially.

### 2. Reorder the `currentStep ===` render blocks (lines ~457-700)

Match the conditional render blocks to the new step numbers so each step renders the correct form fields.

### 3. No other changes needed

- Form validation, field names, and submission logic remain the same
- The agency code / manager reset logic continues to work since it watches the field value, not step numbers
- No database changes required
