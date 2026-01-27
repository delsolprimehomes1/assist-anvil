
# Agent Performance Tracking System & Organization Enhancements

This plan implements a comprehensive performance tracking system with real-time updates between the Organization page and a new Performance page. The system will track leads, dials, appointments, and business submitted with full hierarchy visibility.

---

## Part 1: Database Schema

### New Tables Required

**1. `agent_performance_entries` - Daily performance log entries**
```sql
CREATE TABLE agent_performance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  lead_type TEXT NOT NULL,
  leads_worked INTEGER DEFAULT 0,
  dials_made INTEGER DEFAULT 0,
  appointments_set INTEGER DEFAULT 0,
  appointments_held INTEGER DEFAULT 0,
  clients_closed INTEGER DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  cost_per_lead NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**2. `lead_products` - Admin-configurable lead types**
```sql
CREATE TABLE lead_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  min_quantity INTEGER DEFAULT 1,
  expected_conversion NUMERIC(5,2),
  badge TEXT,
  status TEXT DEFAULT 'active',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**3. `agent_notes` - Manager notes about agents**
```sql
CREATE TABLE agent_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES hierarchy_agents(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**4. `agent_rank_config` - Rank thresholds and requirements**
```sql
CREATE TABLE agent_rank_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL,
  min_ytd_premium NUMERIC(12,2) DEFAULT 0,
  min_agents_recruited INTEGER DEFAULT 0,
  comp_level_percentage NUMERIC(5,2),
  badge_color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Schema Modifications

**Update `hierarchy_agents` table:**
```sql
ALTER TABLE hierarchy_agents ADD COLUMN IF NOT EXISTS comp_level NUMERIC(5,2) DEFAULT 0;
ALTER TABLE hierarchy_agents ADD COLUMN IF NOT EXISTS weekly_business_submitted NUMERIC(12,2) DEFAULT 0;
ALTER TABLE hierarchy_agents ADD COLUMN IF NOT EXISTS last_business_date DATE;
```

### RLS Policies

- **Performance entries**: Agents can CRUD their own; managers can VIEW downline (using path prefix matching)
- **Agent notes**: Only managers/admins can create notes for agents in their downline
- **Lead products**: Admin-only for management; all authenticated users can read
- **Rank config**: Admin-only for management; all authenticated users can read

### Real-time Subscriptions

Enable realtime on `agent_performance_entries` and `hierarchy_agents`:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE agent_performance_entries;
```

---

## Part 2: Organization Page Enhancements

### 2.1 Flip Card Agent Node Component

Create a new `FlippableAgentNode.tsx` that:
- Front side: Shows current circular bubble design with avatar, name, tier
- Back side (on click): Shows detailed info including:
  - Manager notes (scrollable list)
  - Downline count (calculated from path)
  - Comp level percentage
  - Current rank with progress bar to next rank
  - This week's business submitted with color indicator

**Technical approach:**
- Use CSS 3D transforms with `transform-style: preserve-3d` and `rotateY(180deg)`
- State management: `isFlipped` boolean per node
- Animation: 0.6s ease-in-out transition

### 2.2 Agent Card Color Coding for Weekly Activity

Modify the zone color logic to incorporate weekly business submitted:
- **Glowing Green Pulse**: Business submitted this week (>= 1 app)
- Keep existing zone colors for compliance status
- Add a secondary "activity ring" around the avatar

### 2.3 Downline Count Display

Already exists but enhance to show:
- Direct reports count
- Total downline count (recursive)
- Update in real-time when hierarchy changes

### 2.4 Rank & Comp Level Display

On card back:
- Current rank badge (e.g., "Power Producer")
- Comp level (e.g., "85%")
- Progress bar: "Need $15,000 more for Elite"
- Requirements: X more recruits, Y more premium

---

## Part 3: Performance Tracker Page

### 3.1 New Page: `/dashboard/performance`

Create `src/pages/Performance.tsx` with:

**Left Panel - Log Performance Form:**
- Lead Type dropdown (from `lead_products` table)
- Leads Worked (number input)
- Dials Made (number input)
- Appointments Set (number input)
- Appointments Held (number input)
- Clients Closed (number input)
- Revenue (currency input)
- Cost Per Lead (auto-filled from lead type, editable)
- Notes (textarea)
- Save Entry button

**Right Panel - Analytics Dashboard:**
- Time period tabs: "This Week" | "This Month" | "Last 30 Days" | "YTD"
- KPI Cards:
  - Contact Rate = (Appointments Set / Dials Made) * 100
  - Show Rate = (Appointments Held / Appointments Set) * 100
  - Close Rate = (Clients Closed / Appointments Held) * 100
  - ROI = ((Revenue - Total Lead Cost) / Total Lead Cost) * 100
- Lead Type Breakdown table
- Revenue by Lead Type chart (Recharts bar)
- Conversion Funnel visualization

### 3.2 Performance Hook: `useAgentPerformance.ts`

```typescript
interface PerformanceEntry {
  id: string;
  agentId: string;
  entryDate: string;
  leadType: string;
  leadsWorked: number;
  dialsMade: number;
  appointmentsSet: number;
  appointmentsHeld: number;
  clientsClosed: number;
  revenue: number;
  costPerLead: number;
  notes: string | null;
}

interface UseAgentPerformanceReturn {
  entries: PerformanceEntry[];
  weeklyStats: PerformanceStats;
  monthlyStats: PerformanceStats;
  yearlyStats: PerformanceStats;
  loading: boolean;
  addEntry: (entry: Partial<PerformanceEntry>) => Promise<void>;
  refetch: () => Promise<void>;
}
```

### 3.3 Real-time Updates

Subscribe to `agent_performance_entries` changes:
- When Bryson logs an entry, his upline (via path matching) sees it immediately
- Organization page reflects `weekly_business_submitted` in real-time
- Agent cards pulse/glow when new business is logged

---

## Part 4: Hierarchy Visibility Integration

### 4.1 Downline Performance View

When a manager clicks an agent in Organization:
- Show that agent's performance stats (aggregated)
- View individual entries (read-only)
- Add notes about the agent

### 4.2 Data Flow Architecture

```text
Agent logs performance entry
         ↓
agent_performance_entries (INSERT)
         ↓
Trigger updates hierarchy_agents.weekly_business_submitted
         ↓
Realtime broadcasts to:
  - Agent's Performance page
  - All upline managers' Organization views
  - Card color updates to show activity
```

### 4.3 Database Trigger for Weekly Business

```sql
CREATE OR REPLACE FUNCTION update_weekly_business()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE hierarchy_agents
  SET weekly_business_submitted = (
    SELECT COALESCE(SUM(revenue), 0)
    FROM agent_performance_entries
    WHERE agent_id = NEW.agent_id
    AND entry_date >= date_trunc('week', CURRENT_DATE)
  ),
  last_business_date = NEW.entry_date
  WHERE user_id = NEW.agent_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Part 5: Navigation Updates

### Sidebar.tsx
Add new navigation item:
```typescript
{ name: "Performance", href: "/dashboard/performance", icon: TrendingUp }
```

### BottomNav.tsx
Add Performance to mobile navigation

### App.tsx
Add route: `<Route path="/dashboard/performance" element={<Performance />} />`

---

## Part 6: Admin Features

### Lead Products Management

In Admin Dashboard, add "Lead Products" tab:
- CRUD for lead types (name, category, price, min qty, conversion rate, badge)
- Drag-to-reorder functionality
- Status toggle (active/inactive)

---

## Implementation Order

1. **Database migrations** (tables, RLS policies, triggers, realtime)
2. **Lead products table + admin management UI**
3. **Performance page with form and analytics**
4. **useAgentPerformance hook with realtime**
5. **Agent notes table + hierarchy integration**
6. **FlippableAgentNode component**
7. **Update CircularAgentNode with weekly activity indicator**
8. **Rank configuration and progress calculations**
9. **Navigation updates**
10. **Testing real-time sync between pages**

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Performance.tsx` | Main performance tracker page |
| `src/hooks/useAgentPerformance.ts` | Performance data hook with realtime |
| `src/hooks/useLeadProducts.ts` | Lead products configuration hook |
| `src/hooks/useAgentNotes.ts` | Agent notes management hook |
| `src/components/hierarchy/FlippableAgentNode.tsx` | Flip card agent component |
| `src/components/performance/PerformanceForm.tsx` | Log performance form |
| `src/components/performance/PerformanceStats.tsx` | Analytics dashboard |
| `src/components/performance/ConversionFunnel.tsx` | Funnel visualization |
| `src/components/performance/LeadTypeBreakdown.tsx` | Breakdown table |
| `src/components/admin/performance/LeadProductsManagement.tsx` | Admin lead config |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/Sidebar.tsx` | Add Performance nav item |
| `src/components/layout/BottomNav.tsx` | Add Performance for mobile |
| `src/App.tsx` | Add /dashboard/performance route |
| `src/lib/licensing-logic.ts` | Add weekly activity zone logic |
| `src/components/hierarchy/HierarchyTree.tsx` | Use FlippableAgentNode |
| `src/components/hierarchy/CircularAgentNode.tsx` | Add activity ring indicator |
| `src/hooks/useHierarchy.ts` | Fetch new columns, add realtime for performance |
| `src/pages/Admin.tsx` | Add Lead Products tab |

---

## Technical Notes

- **Recharts** is already installed for charts
- **Framer Motion** is installed for flip animations
- Realtime subscriptions use existing Supabase pattern from `useHierarchy.ts`
- RLS uses existing `can_view_hierarchy_agent` function pattern for downline visibility
- Zone color logic extends existing `determineAgentZone()` function
