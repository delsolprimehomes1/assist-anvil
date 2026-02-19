
# Optimize BottomNav Labels

## Problem
The mobile bottom nav has two issues visible in the screenshot:
1. "Order Leads" is too long and wraps awkwardly on small screens
2. The gold "CRM" button looks identical in name to the "CRM" link in the sidebar drawer, causing confusion about what each one does

## Changes — 1 file only: `src/components/layout/BottomNav.tsx`

### 1. Rename "Order Leads" → "Leads"
Line 13: Change the `name` property from `"Order Leads"` to `"Leads"` in the navigation array.

### 2. Rename bottom CRM button label "CRM" → "CRM Signup"
Line 81: Change the `<span>` text from `"CRM"` to `"CRM Signup"` so it clearly signals its purpose — subscribing/signing up — rather than navigating to the CRM app.

## Result

```text
Before:                          After:
[ Dashboard ] [ Order Leads ]   [ Dashboard ] [ Leads ]
[ Performance ] [ Carriers ]    [ Performance ] [ Carriers ]
[ CRM ]                         [ CRM Signup ]
     ↑ ambiguous                      ↑ clearly a sign-up action
```

No other files need to change. The sidebar CRM link (which goes to `app.battersbox.ai`) keeps its label in the drawer nav and is separate from this subscription CTA.
