

# Fix: Performance Analytics Not Updating After Successful Entry

The data **is being saved correctly** to the database (confirmed). The issue is that the analytics panel doesn't refresh to show the new data.

---

## Root Cause

The `addEntry` function in `useAgentPerformance.ts` relies on the Supabase realtime subscription to trigger a refetch after inserting a new entry. However, the realtime notification may be delayed or not received immediately, causing the UI to appear as if nothing was saved.

**Current Flow:**
```text
User submits form → INSERT succeeds → Wait for realtime → (delay/miss) → UI doesn't update
```

**Fixed Flow:**
```text
User submits form → INSERT succeeds → Immediately refetch → UI updates instantly
```

---

## The Fix

**File:** `src/hooks/useAgentPerformance.ts`

In the `addEntry` function, add a call to `fetchEntries()` after the successful insert:

```typescript
// Line 296 - after the success toast
toast({ title: "Success", description: "Performance entry logged" });
await fetchEntries(); // ← ADD THIS LINE
```

This ensures the entries list is refreshed immediately after adding a new one, rather than waiting for the realtime subscription to trigger.

---

## Why This Happens

Supabase Realtime has slight latency, and in some cases:
- The subscription event may arrive after the component has already finished processing
- The subscription channel might not be fully connected yet
- Network conditions can delay the push notification

By calling `fetchEntries()` directly, we guarantee the UI updates without relying on the push mechanism.

---

## Code Change

**Before:**
```typescript
if (insertError) {
  toast({ title: "Error", description: insertError.message, variant: "destructive" });
  throw insertError;
}

toast({ title: "Success", description: "Performance entry logged" });
```

**After:**
```typescript
if (insertError) {
  toast({ title: "Error", description: insertError.message, variant: "destructive" });
  throw insertError;
}

toast({ title: "Success", description: "Performance entry logged" });
await fetchEntries(); // Immediately refresh data
```

---

## Summary

| Change | Location | Description |
|--------|----------|-------------|
| Add `await fetchEntries()` | `useAgentPerformance.ts` line 297 | Refetch entries after successful insert |

This is a one-line fix that will ensure your performance analytics update immediately after logging an entry.

