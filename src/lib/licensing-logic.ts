// Zone-based color logic for Agent Command OS
// Determines agent status based on licensing, activity, and compliance

export type AgentZone = 'red' | 'blue' | 'black' | 'yellow' | 'green' | 'active_business';

export interface EnhancedAgent {
  id: string;
  userId: string;
  status: 'active' | 'inactive' | 'terminated';
  tier: string;
  ytdPremium: number;
  monthlyGoal: number;
  lastActivityAt: string | null;
  lastLoginAt: string | null;
  joinedAt: string | null;
  verificationComplete: boolean;
  contractsPending: number;
  contractsApproved: number;
  residentLicenseExp: string | null;
  ceDueDate: string | null;
  licenseStates: string[];
  fullName: string;
  email: string;
  avatarUrl: string | null;
  depth: number;
  parentId: string | null;
  path: string;
  // New performance fields
  compLevel?: number;
  weeklyBusinessSubmitted?: number;
  lastBusinessDate?: string | null;
}

// Zone color definitions matching the design spec
export const zoneColors: Record<AgentZone, string> = {
  red: '#EF4444',           // Critical - License expired/expiring <7 days
  blue: '#3B82F6',          // Onboarding - Joined <30 days, not verified
  black: '#64748B',         // Inactive - No activity 7+ days
  yellow: '#F59E0B',        // Warning - Pending contracts, license 8-30 days
  green: '#10B981',         // Active - All clear
  active_business: '#22C55E', // Special - Has submitted business this week
};

// Tailwind class mappings for zone colors
export const zoneTailwindClasses: Record<AgentZone, {
  border: string;
  bg: string;
  text: string;
  shadow: string;
  glow: string;
}> = {
  red: {
    border: 'border-red-500',
    bg: 'bg-red-500',
    text: 'text-red-500',
    shadow: 'shadow-red-500/30',
    glow: 'ring-red-500/50',
  },
  blue: {
    border: 'border-blue-500',
    bg: 'bg-blue-500',
    text: 'text-blue-500',
    shadow: 'shadow-blue-500/30',
    glow: 'ring-blue-500/50',
  },
  black: {
    border: 'border-slate-500',
    bg: 'bg-slate-500',
    text: 'text-slate-500',
    shadow: 'shadow-slate-500/30',
    glow: 'ring-slate-500/50',
  },
  yellow: {
    border: 'border-amber-500',
    bg: 'bg-amber-500',
    text: 'text-amber-500',
    shadow: 'shadow-amber-500/30',
    glow: 'ring-amber-500/50',
  },
  green: {
    border: 'border-emerald-500',
    bg: 'bg-emerald-500',
    text: 'text-emerald-500',
    shadow: 'shadow-emerald-500/30',
    glow: 'ring-emerald-500/50',
  },
  active_business: {
    border: 'border-green-400',
    bg: 'bg-green-400',
    text: 'text-green-400',
    shadow: 'shadow-green-400/30',
    glow: 'ring-green-400/50',
  },
};

// Zone descriptions for UI
export const zoneDescriptions: Record<AgentZone, { label: string; description: string }> = {
  red: { label: 'Critical', description: 'License expired or expiring within 7 days' },
  blue: { label: 'Onboarding', description: 'New agent, verification incomplete' },
  black: { label: 'Inactive', description: 'No activity for 7+ days' },
  yellow: { label: 'Warning', description: 'Pending contracts or license expiring soon' },
  green: { label: 'Active', description: 'All systems operational' },
  active_business: { label: 'Producing', description: 'Submitted business this week' },
};

// Helper functions
function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((date2.getTime() - date1.getTime()) / oneDay);
}

function isLicenseExpired(agent: EnhancedAgent): boolean {
  if (!agent.residentLicenseExp) return false;
  const expDate = new Date(agent.residentLicenseExp);
  return expDate < new Date();
}

function isLicenseExpiringWithin(agent: EnhancedAgent, days: number): boolean {
  if (!agent.residentLicenseExp) return false;
  const expDate = new Date(agent.residentLicenseExp);
  const today = new Date();
  const daysUntilExpiry = daysBetween(today, expDate);
  return daysUntilExpiry >= 0 && daysUntilExpiry <= days;
}

function isNewAgent(agent: EnhancedAgent, withinDays: number): boolean {
  if (!agent.joinedAt) return false;
  const joinDate = new Date(agent.joinedAt);
  const today = new Date();
  return daysBetween(joinDate, today) <= withinDays;
}

function daysSinceLastActivity(agent: EnhancedAgent): number {
  const lastActivity = agent.lastLoginAt || agent.lastActivityAt;
  if (!lastActivity) return 999; // No activity recorded
  const lastDate = new Date(lastActivity);
  const today = new Date();
  return daysBetween(lastDate, today);
}

/**
 * Determines the agent's zone based on compliance and activity status.
 * Priority order: Red > Blue > Black > Yellow > Green
 */
export function determineAgentZone(agent: EnhancedAgent): AgentZone {
  // RED: License expired or expiring within 7 days
  if (isLicenseExpired(agent) || isLicenseExpiringWithin(agent, 7)) {
    return 'red';
  }

  // BLUE: New agent (joined <30 days) not verified
  if (isNewAgent(agent, 30) && !agent.verificationComplete) {
    return 'blue';
  }

  // BLACK: No activity for 7+ days
  if (daysSinceLastActivity(agent) >= 7) {
    return 'black';
  }

  // YELLOW: Pending contracts OR license expiring 8-30 days
  if (agent.contractsPending > 0 || isLicenseExpiringWithin(agent, 30)) {
    return 'yellow';
  }

  // GREEN: All systems go
  return 'green';
}

/**
 * Get pulse speed for 3D star animation based on zone
 * Red zones pulse fastest to grab attention
 */
export function getZonePulseSpeed(zone: AgentZone): number {
  switch (zone) {
    case 'red': return 0.5;      // Fast pulse - critical
    case 'yellow': return 0.3;   // Medium pulse - warning
    case 'blue': return 0.2;     // Slow pulse - onboarding
    case 'black': return 0.05;   // Very slow - inactive
    case 'green': return 0.1;    // Gentle pulse - active
    default: return 0.1;
  }
}

/**
 * Get star size multiplier based on production
 */
export function getStarSize(ytdPremium: number): number {
  const baseSize = 0.5;
  const maxSize = 3;
  const scaleFactor = ytdPremium / 100000; // Scale by $100k premium
  return Math.min(baseSize + scaleFactor, maxSize);
}

/**
 * Calculate 3D position for star in galaxy view
 * Creates a spiral galaxy pattern based on hierarchy depth
 */
export function calculateStarPosition(
  agent: EnhancedAgent,
  index: number,
  totalAtDepth: number
): [number, number, number] {
  const { depth } = agent;
  
  // Radius increases with depth (deeper = outer rings)
  const baseRadius = 5;
  const radiusIncrement = 8;
  const radius = baseRadius + (depth * radiusIncrement);
  
  // Distribute agents in a spiral pattern at each depth level
  const angleStep = (2 * Math.PI) / Math.max(totalAtDepth, 1);
  const angle = index * angleStep + (depth * 0.5); // Offset each level for spiral effect
  
  // Add some randomness for organic feel
  const jitter = 2;
  const randomX = (Math.random() - 0.5) * jitter;
  const randomY = (Math.random() - 0.5) * jitter;
  const randomZ = (Math.random() - 0.5) * jitter;
  
  const x = Math.cos(angle) * radius + randomX;
  const y = (Math.random() - 0.5) * 3; // Slight vertical spread
  const z = Math.sin(angle) * radius + randomZ;
  
  return [x, y + randomY, z];
}
