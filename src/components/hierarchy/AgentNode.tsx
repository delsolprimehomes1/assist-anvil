import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { HierarchyAgent } from "@/hooks/useHierarchy";
import { cn } from "@/lib/utils";

export interface AgentNodeData {
  agent: HierarchyAgent;
  isCollapsed: boolean;
  downlineCount: number;
  onToggleCollapse: () => void;
}

// Tier configuration
const tierConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  new_agent: { label: "New Agent", color: "text-blue-700", bgColor: "bg-blue-100" },
  producer: { label: "Producer", color: "text-purple-700", bgColor: "bg-purple-100" },
  power_producer: { label: "Power Producer", color: "text-orange-700", bgColor: "bg-orange-100" },
  elite: { label: "Elite", color: "text-amber-700", bgColor: "bg-amber-100" },
};

// Status colors
const statusColors: Record<string, string> = {
  active: "bg-green-500",
  inactive: "bg-yellow-500",
  terminated: "bg-red-500",
};

interface AgentNodeProps {
  data: AgentNodeData;
}

export const AgentNode = memo(({ data }: AgentNodeProps) => {
  const { agent, isCollapsed, downlineCount, onToggleCollapse } = data;
  const tier = tierConfig[agent.tier] || tierConfig.new_agent;
  const goalProgress = Math.min((agent.ytdPremium / agent.monthlyGoal) * 100, 100);
  
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
        className="!bg-primary !w-3 !h-3 !border-2 !border-background"
      />

      <div
        className={cn(
          "bg-card border-2 rounded-xl shadow-lg p-4 w-[260px] transition-all hover:shadow-xl",
          agent.status === "active" ? "border-primary/20" : "border-muted"
        )}
      >
        {/* Header with avatar and info */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar with progress ring */}
          <div className="relative">
            <svg className="w-14 h-14 -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                strokeWidth="4"
                fill="none"
                className="stroke-muted"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${(goalProgress / 100) * 150.8} 150.8`}
                className="stroke-primary transition-all duration-500"
                strokeLinecap="round"
              />
            </svg>
            <Avatar className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 border-2 border-background">
              <AvatarImage src={agent.avatarUrl || undefined} alt={agent.fullName} />
              <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">
              {agent.fullName}
            </h3>
            <Badge
              variant="secondary"
              className={cn("text-xs mt-1", tier.bgColor, tier.color)}
            >
              {tier.label}
            </Badge>
          </div>

          {/* Status indicator */}
          <div
            className={cn("w-3 h-3 rounded-full", statusColors[agent.status])}
            title={agent.status}
          />
        </div>

        {/* License badges */}
        {agent.licenseStates.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {agent.licenseStates.slice(0, 5).map((state) => (
              <Badge
                key={state}
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5"
              >
                {state}
              </Badge>
            ))}
            {agent.licenseStates.length > 5 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                +{agent.licenseStates.length - 5}
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="space-y-1.5 text-xs border-t pt-3">
          <div className="flex justify-between text-muted-foreground">
            <span>Goal Progress:</span>
            <span className="font-medium text-foreground">
              {goalProgress.toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>YTD Premium:</span>
            <span className="font-medium text-foreground">
              ${(agent.ytdPremium / 1000).toFixed(1)}K
            </span>
          </div>
        </div>

        {/* Downline toggle */}
        {downlineCount > 0 && (
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-2 w-full mt-3 pt-3 border-t text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <Users className="h-3.5 w-3.5" />
            <span>
              {downlineCount} agent{downlineCount !== 1 ? "s" : ""} in downline
            </span>
          </button>
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !w-3 !h-3 !border-2 !border-background"
      />
    </>
  );
});

AgentNode.displayName = "AgentNode";
