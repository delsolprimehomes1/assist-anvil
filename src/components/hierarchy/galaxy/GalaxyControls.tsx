import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  EnhancedAgent,
  determineAgentZone,
  zoneColors,
  zoneDescriptions,
  AgentZone,
} from "@/lib/licensing-logic";

interface GalaxyControlsProps {
  agents: EnhancedAgent[];
}

export function GalaxyControls({ agents }: GalaxyControlsProps) {
  // Calculate zone distribution
  const zoneCounts = useMemo(() => {
    const counts: Record<AgentZone, number> = {
      red: 0,
      blue: 0,
      black: 0,
      yellow: 0,
      green: 0,
    };

    agents.forEach((agent) => {
      const zone = determineAgentZone(agent);
      counts[zone]++;
    });

    return counts;
  }, [agents]);

  const totalAgents = agents.length;
  const totalPremium = agents.reduce((sum, a) => sum + a.ytdPremium, 0);

  return (
    <div className="absolute top-4 left-4 space-y-3">
      {/* Stats card */}
      <div className="bg-background/90 backdrop-blur-md border rounded-lg p-4 shadow-xl">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Production Galaxy
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Agents</span>
            <span className="font-medium text-foreground">{totalAgents}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total YTD Premium</span>
            <span className="font-medium text-foreground">
              ${(totalPremium / 1000).toFixed(0)}K
            </span>
          </div>
        </div>
      </div>

      {/* Zone legend */}
      <div className="bg-background/90 backdrop-blur-md border rounded-lg p-4 shadow-xl">
        <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">
          Zone Legend
        </h4>
        <div className="space-y-2">
          {(Object.keys(zoneColors) as AgentZone[]).map((zone) => (
            <div key={zone} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow-lg"
                style={{
                  backgroundColor: zoneColors[zone],
                  boxShadow: `0 0 8px ${zoneColors[zone]}`,
                }}
              />
              <span className="text-xs text-muted-foreground flex-1">
                {zoneDescriptions[zone].label}
              </span>
              <Badge
                variant="secondary"
                className="text-[10px] h-5 px-1.5 min-w-[24px] justify-center"
              >
                {zoneCounts[zone]}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Controls hint */}
      <div className="bg-background/80 backdrop-blur-sm border rounded-lg p-3 shadow-lg text-xs text-muted-foreground">
        <p className="mb-1">🖱️ Drag to rotate</p>
        <p className="mb-1">📜 Scroll to zoom</p>
        <p>👆 Click star for details</p>
      </div>
    </div>
  );
}
