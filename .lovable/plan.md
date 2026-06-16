## Add "Callin Leads" entry to Sidebar and Dashboard

Both buttons open `https://callins.battersbox.ai/` in a new tab.

### 1. `src/components/layout/Sidebar.tsx`
- Add `Phone` (or similar) icon to the lucide-react imports.
- Insert a new nav item directly after "Order Leads":
  ```ts
  { name: "Callin Leads", href: "https://callins.battersbox.ai/", icon: Phone, external: true },
  ```
- Existing external-link rendering logic already handles `external: true`, so no further changes needed.

### 2. `src/components/dashboard/QuickActions.tsx`
- Add `Phone` to the lucide-react imports.
- Add a new entry to the `actions` array:
  ```ts
  { title: "Callin Leads", icon: Phone, href: "https://callins.battersbox.ai/", external: true }
  ```
- Update the render to use an `<a target="_blank" rel="noopener noreferrer">` when `action.external` is true, instead of `<Link>`. Internal items keep using `<Link>`.

No backend or routing changes required.
