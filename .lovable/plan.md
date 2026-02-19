
# Add BattersBox CRM Subscription Button to Sidebar

Add a prominent CTA button at the bottom of the sidebar that links to the Stripe payment page for CRM subscription sign-up.

---

## Change Overview

**Single file:** `src/components/layout/Sidebar.tsx`

---

## What Changes

### Sidebar Layout

The sidebar `<div>` currently uses a simple `<nav>` block filling its height. We need to restructure it into a flex column so the nav items fill the top and the CRM subscription button is pinned to the bottom.

**Before:**
```
[sidebar container]
  └── [nav items]
```

**After:**
```
[sidebar container - flex col, full height]
  ├── [mobile header]
  ├── [nav items - flex-1, scrollable]
  └── [CRM Subscription button - pinned bottom]
```

### CRM Subscription Button Design

- Placed inside a padded `div` at the bottom of the sidebar
- Styled with a **gold/premium** look to stand out as a CTA
- Uses the `CreditCard` icon from lucide-react
- Label: **"BattersBox CRM"** with subtext **"Subscribe for Access"**
- Opens `https://buy.stripe.com/4gM7sK95m9Ha77s7Itgw00q` in a new tab
- Includes a small `ExternalLink` indicator

---

## Visual Layout

```text
┌─────────────────────────┐
│  Menu             [X]   │  ← mobile header
├─────────────────────────┤
│  Dashboard              │
│  Order Leads    ↗       │
│  CRM            ↗       │
│  Carriers               │
│  News                   │
│  Quoting Tools          │
│  Training               │
│  Marketing              │
│  Compliance             │
│  AI Assist              │
│  Performance            │
│  Organization           │
│  Admin                  │
│                         │
├─────────────────────────┤
│  ┌─────────────────┐    │
│  │ 💳 BattersBox   │    │  ← gold CTA button
│  │    CRM          │    │
│  │ Subscribe ↗     │    │
│  └─────────────────┘    │
└─────────────────────────┘
```

---

## Implementation Details

1. Add `CreditCard` to the lucide-react imports
2. Change the sidebar inner `<div>` to `flex flex-col h-full`
3. Add `flex-1 overflow-y-auto` to the `<nav>` so it scrolls if needed
4. Add a bottom section with a styled anchor tag linking to the Stripe URL

The button will have:
- Gold border and gold text color to differentiate it from nav items
- Background: subtle gold/amber tint (`bg-gold/10 hover:bg-gold/20`)
- Two-line layout: bold name + smaller "Subscribe for Access" subtext
- `CreditCard` icon on left, `ExternalLink` icon on right
