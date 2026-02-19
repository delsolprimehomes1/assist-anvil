
# Add BattersBox CRM Button to Mobile

## Current State

On mobile, there are two navigation surfaces:
1. **Sidebar** (`Sidebar.tsx`) — a slide-out drawer triggered by the hamburger menu. The CRM button already exists here at the bottom, but it's only visible when the drawer is open.
2. **BottomNav** (`BottomNav.tsx`) — the fixed bottom tab bar always visible on mobile. The CRM button is **not** here, so most mobile users never see it.

## What Changes (2 files)

---

### 1. `src/components/layout/BottomNav.tsx` — Add CRM button

The bottom nav currently shows 5 items (Dashboard, Order Leads, CRM, Performance, Carriers). We'll replace the existing **CRM** tab (which goes to an external CRM app) with a dedicated gold-styled **BattersBox CRM** subscribe button so it stands out from the regular nav items.

The new item will be styled differently from the plain nav tabs — a gold accent color to make it clearly a CTA. It links to `https://buy.stripe.com/4gM7sK95m9Ha77s7Itgw00q` and opens in a new tab.

Updated bottom nav layout:
```text
[ Dashboard ] [ Order Leads ] [ 💳 CRM ] [ Performance ] [ Carriers ]
                                  ↑ gold color, CreditCard icon
```

---

### 2. `src/components/layout/Sidebar.tsx` — Polish mobile CRM button

The existing CRM button at the bottom of the sidebar is already functional, but we'll improve it for mobile:
- Add `min-h-[52px]` for a proper touch target (44px+ minimum per mobile-first guidelines)
- Make the text slightly larger and more legible on small screens
- Add a subtle pulsing glow animation to draw attention to it as a CTA

---

## Technical Details

- No database changes needed
- No new dependencies needed
- `CreditCard` icon already imported in `Sidebar.tsx`; will be imported in `BottomNav.tsx`
- The gold color (`text-gold`) is already used in both files so the design token is available
- The bottom nav currently has 5 items which fits all mobile screen widths. Replacing the existing CRM external link with the styled subscribe button keeps the count at 5.
