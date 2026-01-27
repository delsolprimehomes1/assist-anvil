import { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, StickyNote, Users, Percent, TrendingUp, TrendingDown, Receipt, Wallet } from "lucide-react";
import { HierarchyAgent } from "@/hooks/useHierarchy";
import { 
  determineAgentZone, 
  zoneColors,
  EnhancedAgent 
} from "@/lib/licensing-logic";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export interface FlippableAgentNodeData {
  agent: HierarchyAgent & {
    compLevel?: number;
    weeklyBusinessSubmitted?: number;
    totalLeadSpend?: number;
    netProfit?: number;
    notes?: { note: string; createdByName: string }[];
    directReports?: number;
    totalDownline?: number;
    nextRankName?: string;
    nextRankThreshold?: number;
  };
  isCollapsed: boolean;
  downlineCount: number;
  onToggleCollapse: () => void;
  onCardClick?: () => void;
}

const tierConfig: Record<string, { label: string; nextRank: string }> = {
  new_agent: { label: "Agent", nextRank: "Producer" },
  producer: { label: "Producer", nextRank: "Power Producer" },
  power_producer: { label: "Power Producer", nextRank: "Director" },
  elite: { label: "Director", nextRank: "Elite Director" },
};

interface FlippableAgentNodeProps {
  data: FlippableAgentNodeData;
}

export const FlippableAgentNode = memo(({ data }: FlippableAgentNodeProps) => {
  const { agent, isCollapsed, downlineCount, onToggleCollapse, onCardClick } = data;
  const [isFlipped, setIsFlipped] = useState(false);
  
  const tier = tierConfig[agent.tier] || tierConfig.new_agent;
  const zone = determineAgentZone(agent as EnhancedAgent);
  const zoneColor = zoneColors[zone];
  
  const initials = agent.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasWeeklyBusiness = (agent.weeklyBusinessSubmitted || 0) > 0;
  const compLevel = agent.compLevel || 0;
  const ytdProgress = agent.ytdPremium ? Math.min((agent.ytdPremium / (agent.nextRankThreshold || 50000)) * 100, 100) : 0;
  
  // New financial metrics
  const totalLeadSpend = agent.totalLeadSpend || 0;
  const netProfit = agent.netProfit || 0;
  const isProfit = netProfit >= 0;

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />

      <div 
        className="relative cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={handleFlip}
      >
        <motion.div
          className="relative w-32 h-48"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Front Side */}
          <div
            className="absolute inset-0 flex flex-col items-center backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Activity Ring for Weekly Business */}
            <div 
              className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                background: `linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)`,
                boxShadow: `0 0 20px 4px ${zoneColor}40, 0 0 40px 8px ${zoneColor}20`,
                border: `3px solid ${zoneColor}`,
              }}
            >
              {/* Weekly business indicator ring - solid ring, no animation */}
              {hasWeeklyBusiness && (
                <div 
                  className="absolute -inset-1 rounded-full opacity-60"
                  style={{ borderColor: "#10B981", borderWidth: "3px", borderStyle: "solid" }}
                />
              )}
              
              <Avatar className="h-16 w-16 border-2 border-background/50">
                <AvatarImage src={agent.avatarUrl || undefined} alt={agent.fullName} />
                <AvatarFallback className="text-sm font-semibold bg-muted text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <span className="mt-2 text-foreground font-semibold text-xs text-center max-w-[120px] truncate">
              {agent.fullName}
            </span>
            
            <span 
              className="text-[9px] uppercase tracking-widest font-medium"
              style={{ color: zoneColor }}
            >
              {tier.label}
            </span>

            {/* Downline badge */}
            {downlineCount > 0 && (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{downlineCount}</span>
              </div>
            )}

            {/* Expand/collapse */}
            {downlineCount > 0 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse();
                }}
                className={cn(
                  "mt-1 w-5 h-5 rounded-full border flex items-center justify-center",
                  "bg-background hover:bg-muted transition-colors text-[10px]"
                )}
                style={{ borderColor: zoneColor, color: zoneColor }}
              >
                {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Back Side */}
          <div
            className="absolute inset-0 flex flex-col items-center backface-hidden p-2 rounded-xl border bg-card"
            style={{ 
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderColor: zoneColor,
            }}
          >
            <div className="w-full h-full flex flex-col gap-1.5 text-[10px]">
              {/* Comp Level */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Percent className="w-3 h-3 text-primary" />
                  <span className="font-medium">Comp Level</span>
                </div>
                <span className="font-bold text-primary">{compLevel}%</span>
              </div>

              {/* Weekly Business */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span className="font-medium">This Week</span>
                </div>
                <span className={cn("font-bold", hasWeeklyBusiness ? "text-emerald-500" : "text-muted-foreground")}>
                  ${(agent.weeklyBusinessSubmitted || 0).toLocaleString()}
                </span>
              </div>

              {/* Lead Spend */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Receipt className="w-3 h-3 text-amber-500" />
                  <span className="font-medium">Lead Spend</span>
                </div>
                <span className="font-bold text-amber-600">
                  ${totalLeadSpend.toLocaleString()}
                </span>
              </div>

              {/* Net Profit */}
              <div className={cn(
                "flex items-center justify-between p-1 rounded",
                isProfit ? "bg-green-500/10" : "bg-red-500/10"
              )}>
                <div className="flex items-center gap-1">
                  {isProfit ? (
                    <Wallet className="w-3 h-3 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  )}
                  <span className="font-medium">Net</span>
                </div>
                <span className={cn("font-bold", isProfit ? "text-green-600" : "text-red-600")}>
                  {isProfit ? "+" : "-"}${Math.abs(netProfit).toLocaleString()}
                </span>
              </div>

              {/* Downline Count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-blue-500" />
                  <span className="font-medium">Team</span>
                </div>
                <span className="font-bold">{downlineCount}</span>
              </div>

              {/* Progress to next rank */}
              <div className="mt-auto">
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-muted-foreground">→ {tier.nextRank}</span>
                  <span className="font-medium">{ytdProgress.toFixed(0)}%</span>
                </div>
                <Progress value={ytdProgress} className="h-1.5" />
              </div>

              {/* Recent notes indicator */}
              {agent.notes && agent.notes.length > 0 && (
                <div className="flex items-center gap-1 text-amber-500 mt-1">
                  <StickyNote className="w-3 h-3" />
                  <span>{agent.notes.length} note{agent.notes.length !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />
    </>
  );
});

FlippableAgentNode.displayName = "FlippableAgentNode";
