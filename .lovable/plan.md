

# Remove Pulsing Animation and Add Color Legend with Editable Zone Meanings

This plan removes all pulsing animations from the hierarchy chart and adds a visible color legend (color map) that users can customize. Changes will be reflected in real-time across the UI.

---

## Current State

**Pulsing exists in:**
1. `HeatmapNode.tsx` - Lines 68-69: CSS `pulse` animation on red/yellow zones
2. `AgentStar.tsx` - Lines 30-36: 3D breathing pulse effect on all zones
3. `FlippableAgentNode.tsx` - Lines 97-98: `animate-pulse` class on weekly business indicator

**Current zone system:**
- Colors are hardcoded in `licensing-logic.ts`
- Descriptions are hardcoded: Red = Critical, Blue = Onboarding, etc.
- No UI to view or edit zone meanings

---

## Implementation Plan

### 1. Create Database Table for Zone Configuration

**New table:** `zone_config`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| zone_key | text | Unique key (red, blue, black, yellow, green) |
| label | text | Display name ("Critical", "Onboarding", etc.) |
| description | text | User-editable meaning |
| color | text | Hex color code |
| display_order | integer | Sort order in legend |
| created_at | timestamp | Creation date |
| updated_at | timestamp | Last modified |

RLS: Everyone can read, only admins can update.

### 2. Create Hook for Zone Configuration

**New file:** `src/hooks/useZoneConfig.ts`

```typescript
// Features:
// - Fetch zone configs from database
// - Update zone label/description
// - Real-time subscription for instant updates
// - Fallback to hardcoded defaults if DB empty
```

### 3. Create Color Legend Component

**New file:** `src/components/hierarchy/ZoneLegend.tsx`

A floating panel that displays all zone colors with their meanings:

```text
+---------------------------+
|     📊 Agent Status       |
+---------------------------+
| 🔴 Critical               |
|    License expired/expiring|
|    within 7 days          |
+---------------------------+
| 🔵 Onboarding             |
|    New agent, not verified|
+---------------------------+
| ⚫ Inactive               |
|    No activity 7+ days    |
+---------------------------+
| 🟡 Warning                |
|    Pending contracts or   |
|    license expiring soon  |
+---------------------------+
| 🟢 Active                 |
|    All systems operational|
+---------------------------+
| [Edit] (Admin only)       |
+---------------------------+
```

Features:
- Collapsible panel (toggle visibility)
- Position: bottom-right of hierarchy view
- Admin-only "Edit" button opens edit modal

### 4. Create Zone Config Edit Modal (Admin Only)

**New file:** `src/components/hierarchy/ZoneConfigModal.tsx`

A modal for admins to edit zone meanings:

```text
+--------------------------------+
|    Edit Zone Meanings          |
+--------------------------------+
| Red Zone                       |
| Label: [Critical        ]      |
| Meaning: [License expired or   |
|           expiring within 7... ]|
+--------------------------------+
| Blue Zone                      |
| Label: [Onboarding      ]      |
| Meaning: [New agent, not...   ]|
+--------------------------------+
| ... (all zones)                |
+--------------------------------+
|        [Cancel]  [Save]        |
+--------------------------------+
```

### 5. Remove Pulsing Animations

**File:** `src/components/hierarchy/HeatmapNode.tsx`

```typescript
// BEFORE (line 68-69):
animation: zone === 'red' || zone === 'yellow' 
  ? `pulse ${animationDuration}s ease-in-out infinite`
  : undefined,

// AFTER:
// Remove animation property entirely - just use color
```

**File:** `src/components/hierarchy/galaxy/AgentStar.tsx`

```typescript
// BEFORE (lines 30-36):
const pulse = 1 + Math.sin(state.clock.elapsedTime * pulseSpeed * Math.PI * 2) * 0.15;
meshRef.current.scale.setScalar(pulse * hoverScale * selectedScale);

// AFTER:
// Remove pulse calculation, keep only hover/selected scaling
meshRef.current.scale.setScalar(hoverScale * selectedScale);
```

**File:** `src/components/hierarchy/FlippableAgentNode.tsx`

```typescript
// BEFORE (line 97-98):
hasWeeklyBusiness && "animate-pulse"

// AFTER:
// Remove animate-pulse class - weekly business indicator uses solid ring instead
```

### 6. Update Organization Page

**File:** `src/pages/Organization.tsx`

Add the ZoneLegend component to hierarchy and galaxy views:

```tsx
<TabsContent value="hierarchy" className="absolute inset-0 m-0">
  {viewMode === "galaxy" ? (
    <ProductionGalaxy agents={filteredAgents as EnhancedAgent[]} />
  ) : (
    <HierarchyTree agents={filteredAgents} viewMode={viewMode} />
  )}
  <ZoneLegend />  {/* Add color legend */}
</TabsContent>
```

### 7. Real-Time Updates

The `useZoneConfig` hook will include a Supabase realtime subscription:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('zone-config-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'zone_config'
    }, (payload) => {
      // Refresh zone configs immediately
      fetchZoneConfigs();
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, []);
```

When an admin updates a zone description, all users viewing the hierarchy will see the change instantly.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useZoneConfig.ts` | Fetch/update zone configs with realtime sync |
| `src/components/hierarchy/ZoneLegend.tsx` | Floating color map panel |
| `src/components/hierarchy/ZoneConfigModal.tsx` | Admin edit modal for zone meanings |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/hierarchy/HeatmapNode.tsx` | Remove pulse animation |
| `src/components/hierarchy/galaxy/AgentStar.tsx` | Remove breathing pulse effect |
| `src/components/hierarchy/FlippableAgentNode.tsx` | Remove animate-pulse class |
| `src/pages/Organization.tsx` | Add ZoneLegend component |
| `src/lib/licensing-logic.ts` | Update to use dynamic colors from config (with fallbacks) |

## Database Migration

```sql
-- Create zone_config table
CREATE TABLE public.zone_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL,
  color text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.zone_config ENABLE ROW LEVEL SECURITY;

-- Anyone can view zone configs
CREATE POLICY "Anyone can view zone configs"
  ON public.zone_config FOR SELECT
  USING (true);

-- Only admins can update zone configs
CREATE POLICY "Admins can manage zone configs"
  ON public.zone_config FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Insert default values
INSERT INTO public.zone_config (zone_key, label, description, color, display_order) VALUES
  ('red', 'Critical', 'License expired or expiring within 7 days', '#EF4444', 1),
  ('blue', 'Onboarding', 'New agent, verification incomplete', '#3B82F6', 2),
  ('black', 'Inactive', 'No activity for 7+ days', '#64748B', 3),
  ('yellow', 'Warning', 'Pending contracts or license expiring soon', '#F59E0B', 4),
  ('green', 'Active', 'All systems operational', '#10B981', 5);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.zone_config;
```

---

## UI/UX Details

### Color Legend Appearance

- **Position:** Fixed bottom-right corner of hierarchy container
- **Style:** Semi-transparent card with blur backdrop
- **Toggle:** Small "?" icon button to show/hide legend
- **Width:** 220px collapsed to icon, expands on click

### Zone Color Display

Each zone row shows:
- Color circle indicator (24px)
- Label in bold (e.g., "Critical")
- Description in smaller text below
- No pulsing - solid colors only

### Admin Edit Mode

- "Edit" button only visible to admins
- Opens modal with all zones listed
- Each zone has editable Label and Description fields
- Color is displayed but not editable (to maintain consistency)
- Save button updates database and triggers realtime sync

---

## Summary

| Change | Impact |
|--------|--------|
| Remove pulsing from all node types | Cleaner, less distracting visuals |
| Add ZoneLegend component | Users understand what colors mean |
| Add ZoneConfigModal (admin) | Admins can customize zone descriptions |
| Database-backed config | Settings persist and sync across sessions |
| Realtime subscription | Changes appear instantly for all users |

