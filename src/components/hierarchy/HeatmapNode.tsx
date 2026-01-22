import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { HierarchyAgent } from "@/hooks/useHierarchy";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeatmapNodeData {
  agent: HierarchyAgent;
  isCollapsed: boolean;
  downlineCount: number;
  onToggleCollapse: () => void;
}

// Get heat color based on YTD premium
const getHeatColor = (premium: number): string => {
  if (premium < 5000) return "bg-red-500";
  if (premium < 20000) return "bg-yellow-500";
  return "bg-green-500";
};

const getHeatBorderColor = (premium: number): string => {
  if (premium < 5000) return "border-red-600";
  if (premium < 20000) return "border-yellow-600";
  return "border-green-600";
};

export const HeatmapNode = memo(({ data }: NodeProps<HeatmapNodeData>) => {
  const { agent, isCollapsed, downlineCount, onToggleCollapse } = data;
  
  // Get initials from name
  const initials = agent.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const heatColor = getHeatColor(agent.ytdPremium);
  const borderColor = getHeatBorderColor(agent.ytdPremium);

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
              heatColor,
              borderColor,
              downlineCount > 0 && "cursor-pointer",
              isCollapsed && "ring-2 ring-primary ring-offset-2"
            )}
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
