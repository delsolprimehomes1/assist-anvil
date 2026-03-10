

# Admin-Managed Agency Codes & Managers

## Current State
Agency codes and their assigned managers are **hardcoded** in `OnboardingDialog.tsx` (lines 89-101) as a static `AGENCY_MANAGER_MAP` object. Any change requires a code edit.

## Plan

### 1. Create `agency_codes` database table
New table with columns:
- `id` (uuid, PK)
- `code` (text, unique) — e.g. "100", "200"
- `label` (text) — optional display name, e.g. "Lifeco Agency Direct"
- `display_order` (integer, default 0)
- `is_active` (boolean, default true)
- `created_at`, `updated_at`

### 2. Create `agency_managers` database table
- `id` (uuid, PK)
- `agency_code_id` (uuid, FK → agency_codes.id, on delete cascade)
- `manager_name` (text) — display name shown in form, e.g. "K. Jenson"
- `display_order` (integer, default 0)
- `is_active` (boolean, default true)
- `created_at`

### 3. RLS Policies
- **SELECT**: public (anyone can read — needed for unauthenticated onboarding form)
- **INSERT/UPDATE/DELETE**: admin only via `has_role(auth.uid(), 'admin')`

### 4. Seed existing data
Insert the 11 current agency codes and their managers into the new tables so nothing breaks.

### 5. Update `OnboardingDialog.tsx`
- Remove hardcoded `AGENCY_MANAGER_MAP`
- Fetch `agency_codes` (where `is_active = true`) on dialog open
- Fetch `agency_managers` filtered by selected `agency_code_id` (where `is_active = true`)
- Replace the static Select options with dynamic data

### 6. Create Admin UI — `AgencyCodesManagement` component
New tab in the Admin Dashboard with:
- **Table view** of all agency codes with their managers listed inline
- **Add Agency Code** dialog (code, label, display order)
- **Edit/Delete** agency code (with confirmation for delete)
- **Add Manager** to a code (manager name, display order)
- **Edit/Remove Manager** from a code
- Toggle `is_active` for codes and managers without deleting

### 7. Wire into Admin Dashboard
Add a new "Agency Codes" tab in `src/pages/Admin.tsx` rendering the `AgencyCodesManagement` component.

### Files to create/modify
- **New migration**: `agency_codes` + `agency_managers` tables, RLS, seed data
- **New**: `src/components/admin/agency/AgencyCodesManagement.tsx`
- **Edit**: `src/components/auth/OnboardingDialog.tsx` — replace hardcoded map with DB queries
- **Edit**: `src/pages/Admin.tsx` — add Agency Codes tab

