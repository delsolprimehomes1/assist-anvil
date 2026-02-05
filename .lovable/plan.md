
# Add Carrier Reparenting Instructions Tab

This plan adds a "Reparenting" tab to the carrier details modal, allowing agents to view instructions for requesting a reparent to LifeCo Insurance Network. The feature will be available for carriers that have reparenting instructions configured.

---

## Overview

When agents click "Details" on a carrier card (like Ethos), they'll see a new **"Reparenting"** tab that shows:
- Email address to send the request
- Subject line to use
- Pre-filled email template they can copy
- Required information fields
- A one-click button to open their email client with everything pre-filled

---

## Implementation Approach

### Option A: Database-Driven (Recommended)
Store reparenting instructions in the database so admins can manage them for any carrier.

**Pros:**
- Admins can add/edit reparenting info for any carrier via the admin panel
- Scalable to other carriers (American General, Mutual of Omaha, etc.)
- No code changes needed to add new carriers

**Cons:**
- Requires a database migration

### Option B: Hardcoded for Ethos Only
Add reparenting data directly in the Ethos carrier definition in `Carriers.tsx`.

**Pros:**
- Quick to implement
- No database changes

**Cons:**
- Requires code changes to add new carriers
- Less flexible for admins

**Recommendation:** Use Option A (database-driven) for long-term flexibility, as other carriers may have similar reparenting processes.

---

## Database Changes

Add a new nullable JSONB column to the `carriers` table:

```sql
ALTER TABLE public.carriers 
ADD COLUMN reparenting_instructions JSONB DEFAULT NULL;
```

**JSON Structure:**
```json
{
  "email": "agents@getethos.com",
  "subject": "Reparenting Request",
  "template": "Hi Ethos\n\nI am requesting to reparent under LifeCo Insurance Network...",
  "required_fields": [
    { "label": "Agent Name", "placeholder": "Your full name" },
    { "label": "NPN", "placeholder": "Your NPN number" },
    { "label": "Spouse/Significant Other Name*", "placeholder": "N/A if not applicable" },
    { "label": "Spouse/Significant Other NPN*", "placeholder": "N/A if not applicable" },
    { "label": "Name(s) of agency(ies) spouse/significant other currently associated with*", "placeholder": "N/A if not applicable" }
  ],
  "notes": "*please insert N/A if not applicable"
}
```

---

## UI Changes

### 1. CarrierDetailsModal.tsx

Add a conditional 5th tab "Reparenting" that only appears when the carrier has reparenting instructions:

```text
┌────────────────────────────────────────────────────┐
│  [Overview] [Contact] [Products] [UW] [Reparenting]│
└────────────────────────────────────────────────────┘
```

**Reparenting Tab Content:**

```text
┌─────────────────────────────────────────────────────┐
│  📧  Request a Reparent                             │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  Send To                                      │  │
│  │  agents@getethos.com              [Copy]      │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  Subject                                      │  │
│  │  Reparenting Request              [Copy]      │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  Email Template                               │  │
│  │  ─────────────────────────────────────────────│  │
│  │  Hi Ethos                                     │  │
│  │                                               │  │
│  │  I am requesting to reparent under LifeCo    │  │
│  │  Insurance Network. I acknowledge that my    │  │
│  │  compensation will reflect LifeCo Insurance  │  │
│  │  Network compensation.                        │  │
│  │                                               │  │
│  │  Agent Name:                                  │  │
│  │  NPN:                                         │  │
│  │  Spouse/Significant Other Name*:              │  │
│  │  Spouse/Significant Other NPN*:               │  │
│  │  Name(s) of agency(ies) spouse/significant   │  │
│  │  other currently associated with*:            │  │
│  │                                               │  │
│  │  *please insert N/A if not applicable         │  │
│  │                                   [Copy All]  │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  📧  Open in Email Client                     │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ⚠️  Note: Fill in all required fields before     │
│     sending your reparenting request.              │
└─────────────────────────────────────────────────────┘
```

### 2. Carrier Interface Update

Extend the `Carrier` interface to include optional reparenting instructions:

```typescript
interface ReparentingInstructions {
  email: string;
  subject: string;
  template: string;
  notes?: string;
}

interface Carrier {
  // ... existing fields
  reparentingInstructions?: ReparentingInstructions;
}
```

### 3. TabsList Grid Adjustment

Update the grid to support 5 columns on desktop when reparenting is available:

```tsx
<TabsList className={cn(
  "grid w-full gap-2 h-auto p-2 bg-muted/50",
  hasReparenting ? "grid-cols-2 md:grid-cols-5" : "grid-cols-2 md:grid-cols-4"
)}>
```

---

## Admin Panel Enhancement

### CarrierFormDialog.tsx

Add a new accordion section for reparenting instructions:

- Toggle to enable/disable reparenting for this carrier
- Email field
- Subject field  
- Template textarea (multi-line)
- Notes field

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/CarrierDetailsModal.tsx` | Add Reparenting tab with copy buttons and mailto link |
| `src/pages/Carriers.tsx` | Update hardcoded Ethos entry with reparenting data |
| `src/components/admin/CarrierFormDialog.tsx` | Add reparenting instructions form fields |
| Database migration | Add `reparenting_instructions` JSONB column |

---

## Technical Implementation Details

### Copy to Clipboard Functionality

```typescript
const copyToClipboard = async (text: string, label: string) => {
  await navigator.clipboard.writeText(text);
  toast({ title: "Copied!", description: `${label} copied to clipboard` });
};
```

### Mailto Link Generation

```typescript
const openEmailClient = () => {
  const mailtoUrl = `mailto:${reparenting.email}?subject=${encodeURIComponent(reparenting.subject)}&body=${encodeURIComponent(reparenting.template)}`;
  window.open(mailtoUrl, '_blank');
};
```

### Mobile-First Considerations

- Large touch targets for copy buttons (min 44px)
- Full-width buttons on mobile
- Scrollable template area if content is long
- Toast notifications for copy confirmations

---

## Ethos Reparenting Data

Initial data for Ethos carrier:

```json
{
  "email": "agents@getethos.com",
  "subject": "Reparenting Request",
  "template": "Hi Ethos\n\nI am requesting to reparent under LifeCo Insurance Network. I acknowledge that my compensation will reflect LifeCo Insurance Network compensation.\n\nAgent Name:\nNPN:\nSpouse/Significant Other Name*:\nSpouse/Significant Other NPN*:\nName(s) of agency(ies) spouse/significant other currently associated with*:\n\n*please insert N/A if not applicable",
  "notes": "Fill in all required fields before sending your request."
}
```

---

## Summary

This feature enables managers to direct agents to the website for carrier-specific reparenting instructions instead of emailing templates individually. The database-driven approach allows admins to add reparenting info for any carrier without code changes, making it scalable for future carrier partnerships.
