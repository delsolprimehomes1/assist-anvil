import { memo } from "react";
import { Percent, TrendingUp, TrendingDown, Receipt, Wallet, Users, StickyNote } from "lucide-react";
import { HierarchyAgent } from "@/hooks/useHierarchy";
import { cn } from "@/lib/utils";

interface PremiumAgentCardBackProps {
  agent: HierarchyAgent & {
    compLevel?: number;
    weeklyBusinessSubmitted?: number;
    totalLeadSpend?: number;
    netProfit?: number;
    notes?: { note: string; createdByName: string }[];
    nextRankThreshold?: number;
  };
  zoneColor: string;
  tier: { label: string; nextRank: string };
  downlineCount: number;
}

export const PremiumAgentCardBack = memo(({
  agent,
  zoneColor,
  tier,
  downlineCount,
}: PremiumAgentCardBackProps) => {
  const hasWeeklyBusiness = (agent.weeklyBusinessSubmitted || 0) > 0;
  const compLevel = agent.compLevel || 0;
  const totalLeadSpend = agent.totalLeadSpend || 0;
  const netProfit = agent.netProfit || 0;
  const isProfit = netProfit >= 0;
  const ytdProgress = agent.ytdPremium 
    ? Math.min((agent.ytdPremium / (agent.nextRankThreshold || 50000)) * 100, 100) 
    : 0;

  return (
    <div
      className="absolute inset-0 flex flex-col backface-hidden p-3 rounded-3xl"
      style={{ 
        backfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
      }}
    >
      <div className="w-full h-full flex flex-col gap-2 text-[11px]">
        {/* Comp Level */}
        <div className="flex items-center justify-between glass-premium p-2 rounded-xl">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-primary/20">
              <Percent className="w-3 h-3 text-primary" />
            </div>
            <span className="font-medium text-foreground/80">Comp</span>
          </div>
          <span className="font-bold text-primary">{compLevel}%</span>
        </div>

        {/* Weekly Business */}
        <div className="flex items-center justify-between glass-premium p-2 rounded-xl">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500/20">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
            </div>
            <span className="font-medium text-foreground/80">Week</span>
          </div>
          <span className={cn(
            "font-bold",
            hasWeeklyBusiness ? "text-emerald-500" : "text-muted-foreground"
          )}>
            ${(agent.weeklyBusinessSubmitted || 0).toLocaleString()}
          </span>
        </div>

        {/* Lead Spend */}
        <div className="flex items-center justify-between glass-premium p-2 rounded-xl">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-amber-500/20">
              <Receipt className="w-3 h-3 text-amber-500" />
            </div>
            <span className="font-medium text-foreground/80">Leads</span>
          </div>
          <span className="font-bold text-amber-500">
            ${totalLeadSpend.toLocaleString()}
          </span>
        </div>

        {/* Net Profit */}
        <div className={cn(
          "flex items-center justify-between p-2 rounded-xl",
          isProfit ? "bg-green-500/15" : "bg-red-500/15"
        )}>
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center",
              isProfit ? "bg-green-500/30" : "bg-red-500/30"
            )}>
              {isProfit ? (
                <Wallet className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
            </div>
            <span className="font-medium text-foreground/80">Net</span>
          </div>
          <span className={cn("font-bold", isProfit ? "text-green-500" : "text-red-500")}>
            {isProfit ? "+" : "-"}${Math.abs(netProfit).toLocaleString()}
          </span>
        </div>

        {/* Team & Progress Row */}
        <div className="flex gap-2 mt-auto">
          <div className="flex-1 glass-premium p-2 rounded-xl">
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3 text-blue-500" />
              <span className="font-bold">{downlineCount}</span>
            </div>
          </div>
          <div className="flex-1 glass-premium p-2 rounded-xl">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-muted-foreground truncate">→ {tier.nextRank}</span>
              <span className="font-medium">{ytdProgress.toFixed(0)}%</span>
            </div>
            {/* Progress bar */}
            <div className="mt-1 h-1 bg-muted/50 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${ytdProgress}%`,
                  background: `linear-gradient(90deg, ${zoneColor} 0%, ${zoneColor}CC 100%)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Notes indicator */}
        {agent.notes && agent.notes.length > 0 && (
          <div className="flex items-center gap-1.5 text-amber-500 mt-1 px-1">
            <StickyNote className="w-3 h-3" />
            <span className="text-[10px]">{agent.notes.length} note{agent.notes.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
});

PremiumAgentCardBack.displayName = "PremiumAgentCardBack";
