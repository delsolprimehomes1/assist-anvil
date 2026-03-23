

## Plan: Admin-Manageable Carrier Quoting Links

**Goal**: Allow admins to add, edit, and delete carrier quoting cards from the admin dashboard, replacing the hardcoded list.

### Current State
- `CarrierQuotingHub.tsx` has 8 quoting links hardcoded in the file
- No database table exists for quoting links
- Admin dashboard has no management UI for these links

### Changes

**1. Create a `carrier_quoting_links` database table**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| carrier | text | Carrier name |
| name | text | Link display name |
| url | text | External URL |
| type | text | "quick-quote", "agent-portal", or "microsite" |
| requires_login | boolean | Show lock icon |
| description | text | Card description |
| logo_url | text | Optional carrier logo |
| gradient | text | CSS gradient class |
| display_order | integer | Sort order |
| is_active | boolean | Show/hide toggle |
| created_at | timestamptz | Auto |

RLS policies:
- Anyone authenticated can SELECT active links
- Admins can ALL

Seed it with the 8 existing hardcoded links via an INSERT migration.

**2. Add admin management UI**

New tab "Quoting Links" in the admin dashboard (`src/pages/Admin.tsx`) with:
- A table listing all quoting links (name, carrier, type, status)
- Add / Edit dialog with fields for all columns
- Delete with confirmation
- Active/inactive toggle
- Follows the same pattern as `AgencyCodesManagement` or `LeadProductsManagement`

New files:
- `src/components/admin/quoting/QuotingLinksManagement.tsx`
- `src/components/admin/quoting/QuotingLinkFormDialog.tsx`

**3. Update `CarrierQuotingHub.tsx`**

- Remove the hardcoded `quotingLinks` array
- Fetch from `carrier_quoting_links` table (active only, ordered by `display_order`)
- Keep all existing animation and filtering UI unchanged
- Add loading skeleton while fetching

**4. Register the new admin tab**

Add a "Quoting Links" tab trigger and content panel in `Admin.tsx`, following the existing tab pattern.

