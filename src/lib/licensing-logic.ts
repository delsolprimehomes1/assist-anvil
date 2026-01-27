// Zone-based color logic for Agent Command OS
// Determines agent status based on licensing, activity, compliance, and business production

export type AgentZone = 'red' | 'blue' | 'black' | 'yellow' | 'green' | 'producing' | 'investing';

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
  totalLeadSpend?: number;
  netProfit?: number;
}

// Zone color definitions matching the design spec
export const zoneColors: Record<AgentZone, string> = {
  producing: '#22C55E',     // Producing - Business written this month
  investing: '#8B5CF6',     // Investing - Buying leads but no closed business
  red: '#EF4444',           // Critical - License expired/expiring <7 days
  blue: '#3B82F6',          // Onboarding - Joined <30 days, not verified
  black: '#64748B',         // Inactive - No activity 7+ days
  yellow: '#F59E0B',        // Warning - Pending contracts, license 8-30 days
  green: '#10B981',         // Active - All clear, ready to work
};

// Tailwind class mappings for zone colors
export const zoneTailwindClasses: Record<AgentZone, {
  border: string;
  bg: string;
  text: string;
  shadow: string;
  glow: string;
}> = {
  producing: {
    border: 'border-green-500',
    bg: 'bg-green-500',
    text: 'text-green-500',
    shadow: 'shadow-green-500/30',
    glow: 'ring-green-500/50',
  },
  investing: {
    border: 'border-violet-500',
    bg: 'bg-violet-500',
    text: 'text-violet-500',
    shadow: 'shadow-violet-500/30',
    glow: 'ring-violet-500/50',
  },
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
};

// Zone descriptions for UI
export const zoneDescriptions: Record<AgentZone, { label: string; description: string }> = {
  producing: { label: 'Producing', description: 'Business written this month' },
  investing: { label: 'Investing', description: 'Buying leads but no closed business yet' },
  red: { label: 'Critical', description: 'License expired or expiring within 7 days' },
  blue: { label: 'Onboarding', description: 'New agent, verification incomplete' },
  black: { label: 'Inactive', description: 'No activity for 7+ days' },
  yellow: { label: 'Warning', description: 'Pending contracts or license expiring soon' },
  green: { label: 'Active', description: 'Active and ready to work' },
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
 * Check if agent has written business this month
 */
function hasBusinessThisMonth(agent: EnhancedAgent): boolean {
  if (!agent.lastBusinessDate) return false;
  const businessDate = new Date(agent.lastBusinessDate);
  const now = new Date();
  return (
    businessDate.getMonth() === now.getMonth() &&
    businessDate.getFullYear() === now.getFullYear()
  );
}

/**
 * Check if agent is investing in leads but hasn't closed business
 */
function isInvestingNoClose(agent: EnhancedAgent): boolean {
  const hasLeadSpend = (agent.totalLeadSpend || 0) > 0;
  const noClosesRecorded = !agent.lastBusinessDate;
  return hasLeadSpend && noClosesRecorded;
}

/**
 * Determines the agent's zone based on compliance, activity, and business status.
 * Priority order: Red > Producing > Investing > Blue > Black > Yellow > Green
 */
export function determineAgentZone(agent: EnhancedAgent): AgentZone {
  // RED: License expired or expiring within 7 days (critical override)
  if (isLicenseExpired(agent) || isLicenseExpiringWithin(agent, 7)) {
    return 'red';
  }

  // PRODUCING: Has business written this month
  if (hasBusinessThisMonth(agent)) {
    return 'producing';
  }

  // INVESTING: Buying leads but no closed business yet
  if (isInvestingNoClose(agent)) {
    return 'investing';
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

  // GREEN: Active and ready to work
  return 'green';
}

/**
 * Get glow intensity for zone visualization
 * Higher values = more prominent glow effect
 */
export function getZoneGlowIntensity(zone: AgentZone): number {
  switch (zone) {
    case 'producing': return 1.0;  // Brightest - actively producing
    case 'investing': return 0.8;  // High - investing in business
    case 'red': return 0.9;        // High - needs attention
    case 'yellow': return 0.6;     // Medium - warning state
    case 'blue': return 0.5;       // Medium - onboarding
    case 'black': return 0.2;      // Low - inactive
    case 'green': return 0.7;      // Good - ready to work
    default: return 0.5;
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
