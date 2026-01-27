

# Enhanced Performance Tracking with Lead Products & Commission Calculations

This plan adds the lead products from your screenshot, implements discount code pricing, tracks total lead spend vs. business written, and adds commission calculations with advancement percentages for issue pay vs. deferred pay projections.

---

## Part 1: Seed Lead Products Data

Insert the 9 lead products from your screenshot into the `lead_products` table:

| Name | Category | Price | Min Qty | Conv% | Badge |
|------|----------|-------|---------|-------|-------|
| Verified General Life Leads | Verified Life | $37 | 25 | 25% | Premium Lead |
| Annuity Leads | Annuity | $95 | 15 | 30% | MOST POPULAR |
| IUL Leads | IUL | $40 | 25 | 24% | Premium Lead |
| Ethos Leads – Fresh | Ethos | $18 | 50 | 28% | High-Intent Lead |
| Ethos Leads – Aged | Ethos | $8 | 100 | 20% | Value Lead |
| Internet Leads | Internet | $5 | 100 | 18% | - |
| Verified Final Expense Leads | Final Expense | $25 | 25 | 22% | Premium Lead |
| Tele-Marketed Final Expense (FE) Leads | Final Expense | $12 | 50 | 20% | Premium Lead |
| Inbound CallConnect | Inbound Calls | $45 | 10 | 35% | MOST POPULAR |

---

## Part 2: Database Schema Updates

Add new columns to `agent_performance_entries`:

```sql
ALTER TABLE agent_performance_entries
  ADD COLUMN leads_purchased INTEGER DEFAULT 0,
  ADD COLUMN discount_percent NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN total_lead_cost NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN comp_level_percent NUMERIC(5,2) DEFAULT 100,
  ADD COLUMN advancement_percent NUMERIC(5,2) DEFAULT 75,
  ADD COLUMN expected_issue_pay NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN expected_deferred_pay NUMERIC(12,2) DEFAULT 0;
```

These columns track:
- **leads_purchased**: Number of leads bought (for cost calculation)
- **discount_percent**: Agent discount code (5%, 10%, etc.)
- **total_lead_cost**: Calculated cost after discount
- **comp_level_percent**: Agent's commission level (70%, 90%, 100%, 115%, 140%)
- **advancement_percent**: Issue pay percentage (75% default)
- **expected_issue_pay**: Calculated immediate commission
- **expected_deferred_pay**: Calculated 9-month deferred commission

---

## Part 3: Enhanced Performance Form

### 3.1 Lead Purchase Section (New)

Add before Activity section:
- **Leads Purchased** (number input)
- **Discount Code %** (number input: 0, 5, 10%)
- **Calculated Total Cost** (auto-calculated, read-only display)

Formula: `Total Cost = Leads Purchased × (Cost Per Lead × (1 - Discount%))`

### 3.2 Commission Section (New)

Add after Results section:
- **Comp Level %** dropdown (70%, 80%, 90%, 100%, 115%, 125%, 140%)
- **Advancement %** dropdown (75%, 80%, 85%, 90%, 100%)
- **Expected Issue Pay** (calculated display)
- **Expected Deferred Pay** (calculated display + "in 9 months" label)

Formulas:
```
Base Commission = Revenue × (Comp Level % / 100)
Issue Pay = Base Commission × (Advancement % / 100)
Deferred Pay = Base Commission × (1 - Advancement % / 100)
```

### 3.3 Real-time Calculations

All calculations update instantly as user types:
- Discount changes → Total Lead Cost updates
- Revenue/Comp/Advancement changes → Commission projections update
- Visual indicators for Net Profit (Revenue - Lead Cost)

---

## Part 4: Enhanced Stats Display

### 4.1 New KPI Cards

Add to PerformanceStats panel:
- **Total Lead Spend**: Sum of all lead costs (weekly/monthly/yearly)
- **Net Profit**: Revenue minus Lead Spend
- **Avg Comp Level**: Weighted average of comp levels used
- **Expected Earnings**: Total Issue Pay + Deferred Pay

### 4.2 Financial Summary Section

New card showing:
- Total Business Written
- Total Lead Investment
- Net Profit/Loss (with color indicator: green if positive, red if negative)
- Issue Pay Due
- Deferred Pay (9 months)

---

## Part 5: Organization Chart Integration

### 5.1 Update FlippableAgentNode Back Panel

Show on card flip:
- **Total Lead Spend** (from aggregated performance entries)
- **Net Profit** (business - lead spend)
- **Comp Level** (most recent or average)
- Color-coded profit indicator

### 5.2 Update hierarchy_agents Table

Add tracking columns (updated by trigger):
```sql
ALTER TABLE hierarchy_agents
  ADD COLUMN total_lead_spend NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN net_profit NUMERIC(12,2) DEFAULT 0;
```

### 5.3 Update Trigger Function

Modify `update_weekly_business()` to also calculate:
- Cumulative lead spend
- Net profit (revenue - lead cost)
- Store in hierarchy_agents for real-time display

---

## Part 6: Real-time Data Flow

```text
Agent logs entry with:
  - Leads purchased + discount → calculates total_lead_cost
  - Revenue + comp level + advancement → calculates payouts
         ↓
agent_performance_entries (INSERT)
         ↓
Trigger updates hierarchy_agents:
  - weekly_business_submitted
  - total_lead_spend
  - net_profit
         ↓
Realtime broadcasts to:
  - Performance page (stats update)
  - Organization tree (card displays update)
```

---

## Implementation Files

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/performance/LeadPurchaseSection.tsx` | Lead cost calculator with discount |
| `src/components/performance/CommissionSection.tsx` | Comp level and payout calculator |
| `src/components/performance/FinancialSummary.tsx` | Net profit display component |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/performance/PerformanceForm.tsx` | Add lead purchase, discount, comp level, advancement fields |
| `src/components/performance/PerformanceStats.tsx` | Add lead spend, net profit, commission KPIs |
| `src/hooks/useAgentPerformance.ts` | Handle new columns, calculate derived values |
| `src/hooks/useLeadProducts.ts` | Already exists, no changes needed |
| `src/components/hierarchy/FlippableAgentNode.tsx` | Show lead spend & net profit on back |
| `src/hooks/useHierarchy.ts` | Fetch new columns |
| `src/lib/licensing-logic.ts` | Add netProfit field to EnhancedAgent interface |

---

## Database Migration Summary

1. Insert 9 lead products with all pricing/badge data
2. Add new columns to `agent_performance_entries`
3. Add new columns to `hierarchy_agents`
4. Update trigger function to calculate lead spend and net profit

---

## UI/UX Features

### Real-time Discount Calculator
- User enters discount % → price updates instantly
- Shows original price crossed out with new price

### Commission Preview
- Shows issue pay amount with "$X now"
- Shows deferred pay with "9 months: $Y"
- Visual progress bar for advancement %

### Profit/Loss Indicator
- Green glow when net profit positive
- Red warning when spending more than earning
- ROI percentage prominently displayed

