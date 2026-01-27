import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { HierarchyAgent } from "@/hooks/useHierarchy";
import { 
  determineAgentZone, 
  zoneColors, 
  EnhancedAgent 
} from "@/lib/licensing-logic";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface HeatmapNodeData {
  agent: HierarchyAgent;
  isCollapsed: boolean;
  downlineCount: number;
  onToggleCollapse: () => void;
}

interface HeatmapNodeProps {
  data: HeatmapNodeData;
}

export const HeatmapNode = memo(({ data }: HeatmapNodeProps) => {
  const { agent, isCollapsed, downlineCount, onToggleCollapse } = data;
  
  // Get zone-based colors
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
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !w-2 !h-2 !border !border-background"
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={downlineCount > 0 ? onToggleCollapse : undefined}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all hover:scale-110 border-2",
              downlineCount > 0 && "cursor-pointer",
              isCollapsed && "ring-2 ring-primary ring-offset-2"
            )}
            style={{
              backgroundColor: zoneColor,
              borderColor: zoneColor,
              boxShadow: `0 0 20px ${zoneColor}60`,
            }}
          >
            {initials}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <div className="space-y-1">
            <p className="font-semibold">{agent.fullName}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {agent.tier.replace("_", " ")}
            </p>
            <p className="text-xs">
              YTD: ${agent.ytdPremium.toLocaleString()}
            </p>
            <div 
              className="text-xs px-2 py-0.5 rounded mt-1 inline-block"
              style={{ backgroundColor: zoneColor, color: 'white' }}
            >
              {zone.toUpperCase()} ZONE
            </div>
            {downlineCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {downlineCount} in downline
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !w-2 !h-2 !border !border-background"
      />
    </>
  );
});

HeatmapNode.displayName = "HeatmapNode";
