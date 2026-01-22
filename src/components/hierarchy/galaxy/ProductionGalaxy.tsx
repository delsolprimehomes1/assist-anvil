import { Suspense, useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, PerspectiveCamera } from "@react-three/drei";
import { AgentStar } from "./AgentStar";
import { GalaxyControls } from "./GalaxyControls";
import { AgentDetailPanel } from "./AgentDetailPanel";
import { EnhancedAgent, calculateStarPosition } from "@/lib/licensing-logic";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductionGalaxyProps {
  agents: EnhancedAgent[];
}

export function ProductionGalaxy({ agents }: ProductionGalaxyProps) {
  const [selectedAgent, setSelectedAgent] = useState<EnhancedAgent | null>(null);

  // Calculate positions for all agents
  const agentPositions = useMemo(() => {
    // Group agents by depth for position calculation
    const depthGroups = new Map<number, EnhancedAgent[]>();
    agents.forEach((agent) => {
      const group = depthGroups.get(agent.depth) || [];
      group.push(agent);
      depthGroups.set(agent.depth, group);
    });

    // Calculate position for each agent
    return agents.map((agent) => {
      const agentsAtDepth = depthGroups.get(agent.depth) || [];
      const indexAtDepth = agentsAtDepth.findIndex((a) => a.id === agent.id);
      return {
        agent,
        position: calculateStarPosition(agent, indexAtDepth, agentsAtDepth.length),
      };
    });
  }, [agents]);

  return (
    <div className="absolute inset-0 bg-slate-950 rounded-lg overflow-hidden">
      {/* 3D Canvas */}
      <Canvas>
        <Suspense fallback={null}>
          {/* Camera */}
          <PerspectiveCamera makeDefault position={[0, 15, 40]} fov={60} />

          {/* Lighting */}
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 20, 10]} intensity={0.5} />
          <pointLight position={[-10, -20, -10]} intensity={0.3} color="#4338ca" />

          {/* Background stars */}
          <Stars
            radius={150}
            depth={100}
            count={8000}
            factor={4}
            saturation={0}
            fade
            speed={0.5}
          />

          {/* Agent stars */}
          {agentPositions.map(({ agent, position }) => (
            <AgentStar
              key={agent.id}
              agent={agent}
              position={position}
              onClick={setSelectedAgent}
              isSelected={selectedAgent?.id === agent.id}
            />
          ))}

          {/* Camera controls */}
          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            minDistance={10}
            maxDistance={100}
            autoRotate
            autoRotateSpeed={0.3}
          />
        </Suspense>
      </Canvas>

      {/* Overlay controls */}
      <GalaxyControls agents={agents} />

      {/* Selected agent panel */}
      {selectedAgent && (
        <AgentDetailPanel
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}

      {/* Loading overlay */}
      {agents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 animate-pulse" />
            <p className="text-muted-foreground">Loading galaxy...</p>
          </div>
        </div>
      )}
    </div>
  );
}
