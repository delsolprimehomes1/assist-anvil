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
import { HeatmapNode, type HeatmapNodeData } from "./HeatmapNode";
import { HierarchyAgent } from "@/hooks/useHierarchy";
import { ViewMode } from "@/pages/Organization";
import { zoneColors, determineAgentZone, EnhancedAgent } from "@/lib/licensing-logic";

// Define node types with proper typing
const nodeTypes: NodeTypes = {
  agent: CircularAgentNode as any,
  heatmap: HeatmapNode as any,
};

interface HierarchyTreeProps {
  agents: HierarchyAgent[];
  viewMode: ViewMode;
}

// Zone colors for edges (imported from licensing-logic)

export const HierarchyTree = ({ agents, viewMode }: HierarchyTreeProps) => {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Build tree layout from flat agent list
  const { nodes, edges } = useMemo(() => {
    const nodeList: Node[] = [];
    const edgeList: Edge[] = [];

    // Create a map for quick parent lookup
    const agentMap = new Map(agents.map((a) => [a.id, a]));

    // Calculate positions based on hierarchy - larger spacing for circular nodes
    const horizontalSpacing = viewMode === "heatmap" ? 100 : 180;
    const verticalSpacing = viewMode === "heatmap" ? 100 : 200;

    // Track children count per parent for horizontal positioning
    const childrenPositions = new Map<string | null, number>();

    // Sort agents by path to ensure correct ordering
    const sortedAgents = [...agents].sort((a, b) => a.path.localeCompare(b.path));

    // Check if a node should be visible (not hidden by collapsed parent)
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

    // Calculate downline count for each agent
    const getDownlineCount = (agentId: string): number => {
      const agent = agentMap.get(agentId);
      if (!agent) return 0;
      return agents.filter(
        (a) => a.path.startsWith(agent.path + ".") && a.id !== agentId
      ).length;
    };

    sortedAgents.forEach((agent) => {
      if (!isNodeVisible(agent)) return;

      // Calculate x position based on sibling index
      const siblingIndex = childrenPositions.get(agent.parentId) || 0;
      childrenPositions.set(agent.parentId, siblingIndex + 1);

      // Calculate position
      const x = siblingIndex * horizontalSpacing;
      const y = agent.depth * verticalSpacing;

      const isCollapsed = collapsedNodes.has(agent.id);
      const downlineCount = getDownlineCount(agent.id);

      nodeList.push({
        id: agent.id,
        type: viewMode === "heatmap" ? "heatmap" : "agent",
        position: { x, y },
        data: {
          agent,
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

      // Create edge to parent
      if (agent.parentId && agentMap.has(agent.parentId)) {
        const parentAgent = agentMap.get(agent.parentId);
        if (parentAgent && isNodeVisible(parentAgent)) {
          edgeList.push({
            id: `${agent.parentId}-${agent.id}`,
            source: agent.parentId,
            target: agent.id,
            type: "smoothstep",
            animated: agent.status === "active",
            style: {
              stroke: zoneColors[determineAgentZone(agent as EnhancedAgent)] || "#64748b",
              strokeWidth: 2,
            },
          });
        }
      }
    });

    return { nodes: nodeList, edges: edgeList };
  }, [agents, viewMode, collapsedNodes]);

  const [nodesState, setNodes, onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes when they change
  useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  return (
    <div className="absolute inset-0">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.1,
          maxZoom: 1.5,
        }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        className="bg-muted/30"
      >
        <Controls className="bg-background border shadow-md" />
        <MiniMap
          className="bg-background border shadow-md"
          nodeColor={(node: Node) => {
            const data = node.data as any;
            const agent = data?.agent;
            if (agent) {
              const zone = determineAgentZone(agent as EnhancedAgent);
              return zoneColors[zone];
            }
            return "#64748b";
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <Background color="hsl(var(--border))" gap={24} />
      </ReactFlow>
    </div>
  );
};
