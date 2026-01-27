import { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { HierarchyAgent } from "@/hooks/useHierarchy";
import { 
  determineAgentZone, 
  zoneColors,
  EnhancedAgent 
} from "@/lib/licensing-logic";
import { motion } from "framer-motion";
import { PremiumAgentCardFront } from "./PremiumAgentCard";
import { PremiumAgentCardBack } from "./PremiumAgentCardBack";

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
  const { agent, isCollapsed, downlineCount, onToggleCollapse } = data;
  const [isFlipped, setIsFlipped] = useState(false);
  
  const tier = tierConfig[agent.tier] || tierConfig.new_agent;
  const zone = determineAgentZone(agent as EnhancedAgent);
  const zoneColor = zoneColors[zone];

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />

      <motion.div 
        className="relative cursor-pointer"
        style={{ perspective: "1200px" }}
        onClick={handleFlip}
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <motion.div
          className="relative w-40 h-56 gradient-border-premium"
          style={{ 
            transformStyle: "preserve-3d",
            boxShadow: `var(--shadow-premium), 0 0 35px ${zoneColor}35`,
          }}
          animate={{ 
            rotateY: isFlipped ? 180 : 0,
          }}
          whileHover={{
            boxShadow: `var(--shadow-premium-lg), 0 0 50px ${zoneColor}50`,
          }}
          transition={{ 
            rotateY: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
            boxShadow: { duration: 0.3 },
          }}
        >
          {/* Front Side */}
          <PremiumAgentCardFront
            agent={agent}
            zoneColor={zoneColor}
            tier={tier}
            downlineCount={downlineCount}
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
          />

          {/* Back Side */}
          <PremiumAgentCardBack
            agent={agent}
            zoneColor={zoneColor}
            tier={tier}
            downlineCount={downlineCount}
          />
        </motion.div>
      </motion.div>

      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />
    </>
  );
});

FlippableAgentNode.displayName = "FlippableAgentNode";
