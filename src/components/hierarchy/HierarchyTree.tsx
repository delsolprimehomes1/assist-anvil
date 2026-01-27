import { useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  type Node,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CircularAgentNode, type CircularAgentNodeData } from "./CircularAgentNode";
import { FlippableAgentNode, type FlippableAgentNodeData } from "./FlippableAgentNode";
import { HeatmapNode, type HeatmapNodeData } from "./HeatmapNode";
import { HierarchyAgent } from "@/hooks/useHierarchy";
import { ViewMode } from "@/pages/Organization";
import { zoneColors, determineAgentZone, EnhancedAgent } from "@/lib/licensing-logic";
import { PremiumBackground } from "./PremiumBackground";

const nodeTypes: NodeTypes = {
  agent: CircularAgentNode as any,
  flippable: FlippableAgentNode as any,
  heatmap: HeatmapNode as any,
};

interface HierarchyTreeProps {
  agents: HierarchyAgent[];
  viewMode: ViewMode;
}

export const HierarchyTree = ({ agents, viewMode }: HierarchyTreeProps) => {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  const { nodes, edges } = useMemo(() => {
    const nodeList: Node[] = [];
    const edgeList: Edge[] = [];

    const agentMap = new Map(agents.map((a) => [a.id, a]));
    const horizontalSpacing = viewMode === "heatmap" ? 120 : 240;
    const verticalSpacing = viewMode === "heatmap" ? 120 : 260;

    const isNodeVisible = (agent: HierarchyAgent): boolean => {
      const pathParts = agent.path.split(".");
      for (let i = 0; i < pathParts.length - 1; i++) {
        const ancestorPath = pathParts.slice(0, i + 1).join(".");
        const ancestorAgent = agents.find((a) => a.path === ancestorPath);
        if (ancestorAgent && collapsedNodes.has(ancestorAgent.id)) {
          return false;
        }
      }
      return true;
    };

    const getDownlineCount = (agentId: string): number => {
      const agent = agentMap.get(agentId);
      if (!agent) return 0;
      return agents.filter(
        (a) => a.path.startsWith(agent.path + ".") && a.id !== agentId
      ).length;
    };

    const visibleAgents = agents.filter(isNodeVisible);
    const childrenMap = new Map<string | null, HierarchyAgent[]>();
    visibleAgents.forEach((agent) => {
      const siblings = childrenMap.get(agent.parentId) || [];
      siblings.push(agent);
      childrenMap.set(agent.parentId, siblings);
    });

    childrenMap.forEach((children, parentId) => {
      children.sort((a, b) => a.path.localeCompare(b.path));
      childrenMap.set(parentId, children);
    });

    const subtreeWidths = new Map<string, number>();
    const calculateSubtreeWidth = (agentId: string): number => {
      if (collapsedNodes.has(agentId)) {
        subtreeWidths.set(agentId, 1);
        return 1;
      }

      const children = childrenMap.get(agentId) || [];
      if (children.length === 0) {
        subtreeWidths.set(agentId, 1);
        return 1;
      }

      const width = children.reduce((sum, child) => sum + calculateSubtreeWidth(child.id), 0);
      subtreeWidths.set(agentId, width);
      return width;
    };

    const rootAgents = visibleAgents.filter((a) => !a.parentId || !agentMap.has(a.parentId));
    rootAgents.forEach((root) => calculateSubtreeWidth(root.id));

    const nodePositions = new Map<string, { x: number; y: number }>();

    const positionSubtree = (agent: HierarchyAgent, startX: number) => {
      const subtreeWidth = subtreeWidths.get(agent.id) || 1;
      const centerX = startX + (subtreeWidth * horizontalSpacing) / 2 - horizontalSpacing / 2;
      const y = agent.depth * verticalSpacing;

      nodePositions.set(agent.id, { x: centerX, y });

      const children = childrenMap.get(agent.id) || [];
      let childStartX = startX;
      children.forEach((child) => {
        positionSubtree(child, childStartX);
        const childWidth = subtreeWidths.get(child.id) || 1;
        childStartX += childWidth * horizontalSpacing;
      });
    };

    let globalStartX = 0;
    rootAgents.forEach((root) => {
      positionSubtree(root, globalStartX);
      const rootWidth = subtreeWidths.get(root.id) || 1;
      globalStartX += rootWidth * horizontalSpacing + horizontalSpacing;
    });

    visibleAgents.forEach((agent) => {
      const position = nodePositions.get(agent.id) || { x: 0, y: 0 };
      const isCollapsed = collapsedNodes.has(agent.id);
      const downlineCount = getDownlineCount(agent.id);

      nodeList.push({
        id: agent.id,
        type: viewMode === "heatmap" ? "heatmap" : "flippable",
        position,
        data: {
          agent: {
            ...agent,
            compLevel: (agent as any).compLevel || 0,
            weeklyBusinessSubmitted: (agent as any).weeklyBusinessSubmitted || 0,
          },
          isCollapsed,
          downlineCount,
          onToggleCollapse: () => {
            setCollapsedNodes((prev) => {
              const next = new Set(prev);
              if (next.has(agent.id)) {
                next.delete(agent.id);
              } else {
                next.add(agent.id);
              }
              return next;
            });
          },
        },
      } as Node);

      // Create premium gradient edges
      if (agent.parentId && agentMap.has(agent.parentId)) {
        const parentAgent = agentMap.get(agent.parentId);
        if (parentAgent && isNodeVisible(parentAgent)) {
          const parentZone = determineAgentZone(parentAgent as EnhancedAgent);
          const childZone = determineAgentZone(agent as EnhancedAgent);
          const parentColor = zoneColors[parentZone];
          const childColor = zoneColors[childZone];
          
          edgeList.push({
            id: `${agent.parentId}-${agent.id}`,
            source: agent.parentId,
            target: agent.id,
            type: "smoothstep",
            animated: agent.status === "active",
            style: {
              stroke: `url(#gradient-${agent.parentId}-${agent.id})`,
              strokeWidth: 3,
              filter: `drop-shadow(0 0 6px ${childColor}60)`,
            },
            // Store colors for SVG defs
            data: { parentColor, childColor },
          });
        }
      }
    });

    return { nodes: nodeList, edges: edgeList };
  }, [agents, viewMode, collapsedNodes]);

  const [nodesState, setNodes, onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);

  useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  return (
    <div className="absolute inset-0">
      {/* Premium ambient background */}
      <PremiumBackground />
      
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.3,
          minZoom: 0.1,
          maxZoom: 1.5,
        }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        className="bg-transparent"
      >
        {/* SVG Gradient Definitions */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            {edgesState.map((edge) => {
              const edgeData = edge.data as { parentColor?: string; childColor?: string } | undefined;
              if (!edgeData?.parentColor || !edgeData?.childColor) return null;
              return (
                <linearGradient
                  key={`gradient-${edge.id}`}
                  id={`gradient-${edge.id}`}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={edgeData.parentColor} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={edgeData.childColor} stopOpacity="0.9" />
                </linearGradient>
              );
            })}
          </defs>
        </svg>
        
        {/* Premium styled controls */}
        <Controls 
          className="glass-premium-strong !rounded-xl !border-0 overflow-hidden"
          style={{ 
            boxShadow: 'var(--shadow-premium)',
          }}
        />
        <MiniMap
          className="glass-premium-strong !rounded-xl !border-0 overflow-hidden"
          style={{
            boxShadow: 'var(--shadow-premium)',
          }}
          nodeColor={(node: Node) => {
            const data = node.data as any;
            const agent = data?.agent;
            if (agent) {
              const zone = determineAgentZone(agent as EnhancedAgent);
              return zoneColors[zone];
            }
            return "#64748b";
          }}
          maskColor="rgba(0, 0, 0, 0.15)"
        />
        <Background color="hsl(var(--border) / 0.3)" gap={32} size={1} />
      </ReactFlow>
    </div>
  );
};
