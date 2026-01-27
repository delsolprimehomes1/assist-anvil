import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { HierarchyAgent } from "@/hooks/useHierarchy";
import { 
  determineAgentZone, 
  zoneColors,
  EnhancedAgent 
} from "@/lib/licensing-logic";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PremiumAgentCardFrontProps {
  agent: HierarchyAgent & {
    compLevel?: number;
    weeklyBusinessSubmitted?: number;
  };
  zoneColor: string;
  tier: { label: string };
  downlineCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const PremiumAgentCardFront = memo(({
  agent,
  zoneColor,
  tier,
  downlineCount,
  isCollapsed,
  onToggleCollapse,
}: PremiumAgentCardFrontProps) => {
  const initials = agent.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasWeeklyBusiness = (agent.weeklyBusinessSubmitted || 0) > 0;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center p-4 backface-hidden"
      style={{ backfaceVisibility: "hidden" }}
    >
      {/* Avatar with premium glow ring */}
      <div className="relative mb-3">
        {/* Outer glow ring */}
        <div 
          className="absolute -inset-2 rounded-full opacity-60 blur-sm"
          style={{ 
            background: `radial-gradient(circle, ${zoneColor}40 0%, transparent 70%)`,
          }}
        />
        
        {/* Main avatar container */}
        <div 
          className="relative w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.5) 100%)',
            boxShadow: `0 0 0 3px ${zoneColor}, 0 0 30px ${zoneColor}50`,
          }}
        >
          {/* Weekly business indicator */}
          {hasWeeklyBusiness && (
            <div 
              className="absolute -inset-1 rounded-full"
              style={{ 
                border: '2px solid #22C55E',
                boxShadow: '0 0 12px rgba(34, 197, 94, 0.5)',
              }}
            />
          )}
          
          <Avatar className="h-14 w-14 border-2 border-background/30">
            <AvatarImage src={agent.avatarUrl || undefined} alt={agent.fullName} />
            <AvatarFallback 
              className="text-sm font-bold"
              style={{ 
                background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--card)) 100%)',
                color: 'hsl(var(--foreground) / 0.9)',
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Weekly business icon badge */}
        {hasWeeklyBusiness && (
          <div 
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.4)',
            }}
          >
            <TrendingUp className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold text-foreground/95 text-center max-w-[130px] truncate tracking-tight">
        {agent.fullName}
      </h3>
      
      {/* Tier badge */}
      <span 
        className="text-[10px] uppercase tracking-[0.15em] font-semibold mt-1 px-2 py-0.5 rounded-full"
        style={{ 
          color: zoneColor,
          background: `${zoneColor}15`,
          border: `1px solid ${zoneColor}30`,
        }}
      >
        {tier.label}
      </span>

      {/* Downline count */}
      {downlineCount > 0 && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span className="font-medium">{downlineCount}</span>
        </div>
      )}

      {/* Expand/collapse button */}
      {downlineCount > 0 && (
        <motion.button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className={cn(
            "mt-2 w-6 h-6 rounded-full flex items-center justify-center",
            "glass-premium hover:scale-110 transition-transform"
          )}
          style={{ 
            borderColor: `${zoneColor}50`,
            color: zoneColor,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isCollapsed ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </motion.button>
      )}
    </div>
  );
});

PremiumAgentCardFront.displayName = "PremiumAgentCardFront";
