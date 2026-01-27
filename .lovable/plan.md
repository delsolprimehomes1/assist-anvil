
# Enhanced Color Legend with Business Activity Tracking

This plan makes the zone color legend more prominent and visible, and updates the zone logic to properly track business-related statuses like "business written this month," "buying leads but no business," and other activity states.

---

## Current State Analysis

**What exists:**
- `ZoneLegend` component - a small collapsible panel in bottom-right corner
- 5 zones defined: Red (Critical), Blue (Onboarding), Black (Inactive), Yellow (Warning), Green (Active)
- Zone logic in `licensing-logic.ts` checks license status and login activity
- Database table `zone_config` stores editable zone meanings
- Performance data tracked: `weeklyBusinessSubmitted`, `lastBusinessDate`, `totalLeadSpend`, `netProfit`

**What's missing:**
- Legend is too small and hidden behind a button - not "dominant"
- No zone specifically for "business written this month"
- No tracking for "buying leads but hasn't written business"
- Current Green zone just means "all systems operational" - not business-specific

---

## Implementation Plan

### 1. Add New Zones to Database

Add 2 new zones to track business activity:

| Zone Key | Label | Description | Color |
|----------|-------|-------------|-------|
| `producing` | Producing | Business written this month | `#22C55E` (Bright Green) |
| `investing` | Investing | Buying leads but no closed business yet | `#8B5CF6` (Purple) |

Update existing zones with clearer business-focused descriptions:
- **Green** → "Active & Ready" - Logged in recently, ready to produce
- **Red** → Keep as license critical (override all business states)

### 2. Update Zone Logic Priority

New logic flow in `determineAgentZone()`:

```text
Priority Order (highest to lowest):
1. RED - License expired/expiring (critical override)
2. PRODUCING - Has business written this month ($$)
3. INVESTING - Has lead spend but no closed business yet
4. BLUE - New agent, not verified
5. BLACK - No activity 7+ days
6. YELLOW - Pending contracts or license warning
7. GREEN - Active and ready (logged in, no issues)
```

### 3. Make Legend Dominant and Always Visible

Replace the collapsible hidden legend with a prominent fixed sidebar:

```text
+------------------------------------------+
|                                          |
|  [HIERARCHY CHART]                       |
|                                          |
|                         +---------------+|
|                         | 📊 STATUS KEY ||
|                         |               ||
|                         | 🟢 Producing  ||
|                         | Business this ||
|                         | month         ||
|                         |               ||
|                         | 🟣 Investing  ||
|                         | Buying leads, ||
|                         | no close yet  ||
|                         |               ||
|                         | 🔴 Critical   ||
|                         | License issue ||
|                         |               ||
|                         | ⚫ Inactive   ||
|                         | 7+ days quiet ||
|                         |               ||
|                         | 🟡 Warning    ||
|                         | Pending items ||
|                         |               ||
|                         | 🔵 Onboarding ||
|                         | New, unverified|
|                         |               ||
|                         | 🟢 Active     ||
|                         | Ready to work ||
|                         +---------------+|
+------------------------------------------+
```

**Key visibility improvements:**
- Always visible (no toggle to hide)
- Larger color circles (32px instead of 20px)
- More prominent typography
- Fixed position with slight transparency
- Responsive: collapses to smaller on mobile

### 4. Update Zone Tracking Logic

**New helper functions in `licensing-logic.ts`:**

```typescript
// Check if agent has written business this month
function hasBusinessThisMonth(agent: EnhancedAgent): boolean {
  if (!agent.lastBusinessDate) return false;
  const businessDate = new Date(agent.lastBusinessDate);
  const now = new Date();
  return (
    businessDate.getMonth() === now.getMonth() &&
    businessDate.getFullYear() === now.getFullYear()
  );
}

// Check if agent is investing in leads but hasn't closed
function isInvestingNoClose(agent: EnhancedAgent): boolean {
  const hasLeadSpend = (agent.totalLeadSpend || 0) > 0;
  const hasNoBusiness = (agent.weeklyBusinessSubmitted || 0) === 0;
  const noClosesRecorded = !agent.lastBusinessDate;
  return hasLeadSpend && (hasNoBusiness || noClosesRecorded);
}
```

**Updated zone determination:**

```typescript
export function determineAgentZone(agent: EnhancedAgent): AgentZone {
  // RED: License critical (always first)
  if (isLicenseExpired(agent) || isLicenseExpiringWithin(agent, 7)) {
    return 'red';
  }

  // PRODUCING: Business written this month
  if (hasBusinessThisMonth(agent)) {
    return 'producing';
  }

  // INVESTING: Buying leads but no closed business
  if (isInvestingNoClose(agent)) {
    return 'investing';
  }

  // BLUE: New agent not verified
  if (isNewAgent(agent, 30) && !agent.verificationComplete) {
    return 'blue';
  }

  // BLACK: No activity for 7+ days
  if (daysSinceLastActivity(agent) >= 7) {
    return 'black';
  }

  // YELLOW: Pending contracts or license warning
  if (agent.contractsPending > 0 || isLicenseExpiringWithin(agent, 30)) {
    return 'yellow';
  }

  // GREEN: Active and ready
  return 'green';
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/hierarchy/ZoneLegend.tsx` | Make always visible, larger, more prominent |
| `src/lib/licensing-logic.ts` | Add `producing` and `investing` zones with business tracking logic |
| `src/hooks/useZoneConfig.ts` | Add new default zones for fallback |

## Database Changes

Insert 2 new rows into `zone_config`:

```sql
INSERT INTO public.zone_config (zone_key, label, description, color, display_order) VALUES
  ('producing', 'Producing', 'Business written this month', '#22C55E', 0),
  ('investing', 'Investing', 'Buying leads but no closed business yet', '#8B5CF6', 1);

-- Update existing display orders to accommodate new zones
UPDATE public.zone_config SET display_order = display_order + 2 WHERE zone_key NOT IN ('producing', 'investing');
```

---

## UI/UX Details

### Always-Visible Legend Panel

- **Position:** Fixed right side of hierarchy container
- **Width:** 200px on desktop, 160px on tablet, 48px (icon only) on mobile
- **Background:** Semi-transparent with blur (`bg-card/95 backdrop-blur-sm`)
- **Border:** Left border accent with primary color
- **Shadow:** Subtle drop shadow for depth

### Zone Display Elements

Each zone row shows:
- **Color circle:** 32px diameter with border and glow effect
- **Label:** Bold 14px font
- **Description:** 12px muted text, 2 lines max
- **Spacing:** 12px between zones

### Mobile Responsive Behavior

On mobile (< 640px):
- Legend collapses to vertical icon strip
- Tap to expand full legend as overlay
- Quick glance still shows all 7 colors

### Admin Edit Access

- Settings gear icon in legend header (admin only)
- Opens `ZoneConfigModal` to customize labels/descriptions
- Real-time updates still work

---

## Summary of Changes

| Change | User Benefit |
|--------|--------------|
| Always-visible legend | Users instantly see what colors mean |
| Larger color indicators | Colors are prominent and easy to identify |
| "Producing" zone (bright green) | Immediately spot agents writing business |
| "Investing" zone (purple) | Identify agents spending on leads but not closing |
| Business-based tracking | Zone colors reflect actual production activity |
| Real-time sync | Admin changes update immediately for everyone |

This ensures managers can glance at the hierarchy and instantly understand:
- Who is writing business (bright green)
- Who is investing but needs help closing (purple)
- Who has license issues (red)
- Who has gone quiet (black)
- Who is new and needs onboarding (blue)
