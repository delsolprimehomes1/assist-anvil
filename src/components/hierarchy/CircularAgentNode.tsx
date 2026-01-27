import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp } from "lucide-react";
import { HierarchyAgent } from "@/hooks/useHierarchy";
import { 
  determineAgentZone, 
  zoneColors,
  EnhancedAgent 
} from "@/lib/licensing-logic";
import { cn } from "@/lib/utils";

export interface CircularAgentNodeData {
  agent: HierarchyAgent;
  isCollapsed: boolean;
  downlineCount: number;
  onToggleCollapse: () => void;
}

// Tier configuration
const tierConfig: Record<string, { label: string }> = {
  new_agent: { label: "Agent" },
  producer: { label: "Producer" },
  power_producer: { label: "Power Producer" },
  elite: { label: "Director" },
};

interface CircularAgentNodeProps {
  data: CircularAgentNodeData;
}

export const CircularAgentNode = memo(({ data }: CircularAgentNodeProps) => {
  const { agent, isCollapsed, downlineCount, onToggleCollapse } = data;
  const tier = tierConfig[agent.tier] || tierConfig.new_agent;
  
  // Get zone and styling
  const zone = determineAgentZone(agent as EnhancedAgent);
  const zoneColor = zoneColors[zone];
  
  // Get initials from name
  const initials = agent.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />

      <div className="flex flex-col items-center">
      {/* 3D Orb with glassmorphic effect */}
      <div 
        className="relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-105"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 50% 15%, rgba(255,255,255,0.35) 0%, transparent 50%),
            radial-gradient(ellipse 80% 50% at 50% 90%, rgba(0,0,0,0.2) 0%, transparent 50%),
            linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)
          `,
          boxShadow: `
            0 0 0 2px ${zoneColor}90,
            0 0 35px 8px ${zoneColor}35,
            0 12px 40px -8px ${zoneColor}50,
            inset 0 3px 12px rgba(255,255,255,0.25),
            inset 0 -4px 12px rgba(0,0,0,0.15)
          `,
          border: `3px solid transparent`,
        }}
      >
        {/* Glass reflection overlay */}
        <div 
          className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)`,
          }}
        />
        {/* Subtle inner ring */}
        <div 
          className="absolute inset-2 rounded-full opacity-40"
          style={{
            background: `radial-gradient(circle at 50% 25%, ${zoneColor}30 0%, transparent 60%)`,
          }}
        />
          
          <Avatar className="h-20 w-20 border-2 border-background/50">
            <AvatarImage src={agent.avatarUrl || undefined} alt={agent.fullName} />
            <AvatarFallback 
              className="text-lg font-semibold bg-muted text-foreground"
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Name */}
        <span className="mt-3 text-foreground font-semibold text-sm text-center max-w-[120px] truncate">
          {agent.fullName}
        </span>
        
        {/* Role badge */}
        <span 
          className="text-[10px] uppercase tracking-widest font-medium mt-0.5"
          style={{ color: zoneColor }}
        >
          {tier.label}
        </span>

        {/* Expand/collapse button */}
        {downlineCount > 0 && (
          <button 
            onClick={onToggleCollapse}
            className={cn(
              "mt-2 w-7 h-7 rounded-full border-2 flex items-center justify-center",
              "bg-background hover:bg-muted transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-offset-2"
            )}
            style={{ 
              borderColor: zoneColor,
              color: zoneColor,
            }}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Downline count badge */}
        {downlineCount > 0 && (
          <span className="mt-1 text-[10px] text-muted-foreground">
            {downlineCount} agent{downlineCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
    </>
  );
});

CircularAgentNode.displayName = "CircularAgentNode";
