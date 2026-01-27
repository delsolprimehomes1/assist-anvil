
# Editable Performance Entries List

This plan adds a new component to display all logged performance entries with full editing capabilities, allowing agents to adjust their numbers when applications decline or issue differently than expected.

---

## Current State

**What exists:**
- `useAgentPerformance` hook with `updateEntry()` and `deleteEntry()` functions (already implemented)
- Performance form for creating new entries
- Analytics dashboard showing aggregated stats
- Database supports full CRUD on `agent_performance_entries`

**What's missing:**
- A visible list of individual entries
- UI to edit/delete existing entries
- Ability to adjust numbers when declines happen

---

## Implementation Plan

### 1. Create Performance Entries List Component

**New file:** `src/components/performance/PerformanceEntriesList.tsx`

A scrollable list/table showing all logged entries with:
- Date
- Lead Type
- Clients Closed
- Revenue (Annual Premium)
- Issue Pay
- Lead Cost
- Net Profit/Loss
- Edit and Delete buttons

Each row will be expandable or have an edit modal to modify:
- Clients Closed (reduce when decline happens)
- Revenue (adjust based on what actually issued)
- Issue Pay (recalculates automatically)
- Notes (add decline reason)

### 2. Create Edit Entry Dialog

**New file:** `src/components/performance/EditEntryDialog.tsx`

A modal dialog that allows editing all fields of an entry:
- Pre-populated with current values
- Real-time recalculation of Issue Pay, Deferred Pay, and Net Profit
- "Decline Adjustment" quick action that:
  - Reduces clients closed by 1
  - Prompts for new revenue amount
  - Recalculates commission

### 3. Update Performance Page Layout

**File:** `src/pages/Performance.tsx`

Restructure to include the entries list:

```text
+----------------------------------+
|        Performance Tracker       |
+----------------------------------+
|  Log Form  |   Analytics Panel   |
|  (1 col)   |    (2 cols)         |
+----------------------------------+
|        Entry History (full width)|
|  [Date] [Type] [Closed] [Rev]... |
|  [Edit] [Delete]                 |
+----------------------------------+
```

### 4. Update useAgentPerformance Hook

**File:** `src/hooks/useAgentPerformance.ts`

Add `await fetchEntries()` after `updateEntry` and `deleteEntry` to ensure immediate UI refresh (similar to the fix for `addEntry`).

---

## Entry List UI Design

### Table Columns

| Date | Lead Type | Closed | Revenue | Issue Pay | Lead Cost | Net | Actions |
|------|-----------|--------|---------|-----------|-----------|-----|---------|
| Jan 27 | Annuity | 1 | $1,000 | $750 | $950 | -$200 | Edit / Delete |

### Edit Dialog Fields

**Results Section (Editable):**
- Clients Closed (number input)
- Revenue/Annual Premium (currency input)

**Commission Section (Editable):**
- Comp Level % (dropdown: 70, 80, 90, 100, 115, 125, 140)
- Advancement % (dropdown: 75, 80, 85, 90, 100)

**Calculated (Read-only, updates in real-time):**
- Issue Pay = Revenue x Comp% x Advancement%
- Deferred Pay = Revenue x Comp% x (1 - Advancement%)

**Notes:**
- Text area for decline reasons or adjustments

---

## Decline Workflow Example

**Scenario:** Agent logged 2 clients closed with $2,000 revenue, but 1 application declined.

1. Agent opens the Performance page
2. Finds the entry in the history list
3. Clicks "Edit" button
4. Changes:
   - Clients Closed: 2 → 1
   - Revenue: $2,000 → $1,000
   - Notes: "1 decline - health history issue"
5. Issue Pay automatically recalculates: $1,500 → $750
6. Net Profit updates: Shows new position (still in the hole or now profitable)
7. Clicks "Save"
8. Analytics dashboard immediately reflects the adjustment

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/performance/PerformanceEntriesList.tsx` | Displays all entries in a scrollable table |
| `src/components/performance/EditEntryDialog.tsx` | Modal for editing entry values with recalculation |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Performance.tsx` | Add entries list below the current layout |
| `src/hooks/useAgentPerformance.ts` | Add `fetchEntries()` after update/delete for immediate refresh |

---

## Technical Details

### PerformanceEntriesList Component

```typescript
// Props
interface PerformanceEntriesListProps {
  entries: PerformanceEntry[];
  onEdit: (entry: PerformanceEntry) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

// Features
- Sorted by date (newest first)
- Color-coded net profit (green = profit, red = loss)
- Responsive: table on desktop, cards on mobile
- Confirmation dialog before delete
```

### EditEntryDialog Component

```typescript
// Props
interface EditEntryDialogProps {
  entry: PerformanceEntry | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<PerformanceEntry>) => Promise<void>;
}

// Features
- Real-time calculation as values change
- Preserves lead purchase data (cost per lead, leads purchased)
- Only allows editing relevant fields (closed, revenue, comp, advancement, notes)
```

---

## Summary

This implementation adds full visibility into logged performance data with the ability to adjust numbers when applications decline. The workflow is:

1. View all entries in the history list
2. Click Edit to modify an entry
3. Adjust clients closed and revenue based on actual issued business
4. System recalculates Issue Pay, Deferred Pay, and Net Profit
5. Analytics dashboard updates in real-time

This ensures agents always have accurate tracking of their "in the hole" or profitable status based on what actually issues, not just what was submitted.
