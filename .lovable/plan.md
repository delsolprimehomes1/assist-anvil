

# Fix Net Profit Calculation and Add Total Leads Display

The performance tracking system already has the infrastructure for lead purchases and commission calculations. However, the **Net Profit calculation is incorrect** and needs to be fixed to properly show when an agent is "in the hole."

---

## The Problem

**Current Logic (Wrong):**
```
Net Profit = Revenue - Lead Cost
```
Example: $1,000 revenue - $950 lead cost = $50 profit (WRONG)

**Correct Logic (Your Business Model):**
```
Net Profit = Issue Pay - Lead Cost
```
Example: $750 issue pay - $950 lead cost = -$200 loss (CORRECT)

The agent receives the **commission** (Issue Pay), not the full premium. So if they spend $950 on leads and only get $750 in issue pay at 75% advancement, they're **in the hole $200**.

---

## Changes Required

### 1. Fix `useAgentPerformance.ts` - Line 130

Change the `calculateStats` function:
```typescript
// BEFORE (wrong):
const netProfit = totals.revenue - totals.totalLeadCost;

// AFTER (correct):
const netProfit = totals.totalIssuePay - totals.totalLeadCost;
```

Also update ROI calculation to be based on Issue Pay:
```typescript
// BEFORE:
const roi = totals.totalLeadCost > 0 
  ? ((totals.revenue - totals.totalLeadCost) / totals.totalLeadCost) * 100 
  : 0;

// AFTER:
const roi = totals.totalLeadCost > 0 
  ? ((totals.totalIssuePay - totals.totalLeadCost) / totals.totalLeadCost) * 100 
  : 0;
```

### 2. Add `totalLeadsPurchased` to PerformanceStats Interface

Add new field to track total leads purchased:
```typescript
export interface PerformanceStats {
  // ... existing fields
  totalLeadsPurchased: number; // NEW
}
```

Update `calculateStats` to sum leads purchased:
```typescript
leadsPurchased: acc.leadsPurchased + entry.leadsPurchased,
```

### 3. Fix `FinancialSummary.tsx` - Line 18

Same issue - change:
```typescript
// BEFORE:
const netProfit = totalRevenue - totalLeadSpend;

// AFTER:
const netProfit = totalIssuePay - totalLeadSpend;
```

### 4. Update `PerformanceStats.tsx` Display

Add a "Total Leads Purchased" KPI card showing the count of leads bought for the period.

Update the description text to clarify the calculation:
- "Net Profit = Issue Pay - Lead Cost"
- Show breakdown: "$750 Issue Pay - $950 Lead Spend = -$200"

---

## Example Scenario (Your Use Case)

| Field | Value |
|-------|-------|
| Lead Type | Annuity Leads |
| Leads Purchased | 10 |
| Cost Per Lead | $95 |
| Discount | 0% |
| **Total Lead Cost** | **$950** |
| | |
| Revenue (Annual Premium) | $1,000 |
| Comp Level | 100% |
| Advancement | 75% |
| **Issue Pay** | **$750** |
| **Deferred Pay (9 mo)** | **$250** |
| | |
| **Net Profit (Issue Pay - Lead Cost)** | **-$200** |
| Status | **In the hole $200** |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useAgentPerformance.ts` | Fix netProfit and ROI calculations, add totalLeadsPurchased |
| `src/components/performance/PerformanceStats.tsx` | Add Total Leads Purchased display, clarify profit calculation |
| `src/components/performance/FinancialSummary.tsx` | Fix netProfit calculation |

---

## Visual Enhancements

1. **Profit/Loss Breakdown Card** - Show calculation step-by-step:
   - Issue Pay: $750
   - Lead Spend: -$950
   - Net: -$200 (IN THE HOLE)

2. **Color Coding**:
   - Green when Issue Pay > Lead Cost (profitable)
   - Red when Issue Pay < Lead Cost (in the hole)

3. **Total Leads Purchased** - New stat showing count for the period

