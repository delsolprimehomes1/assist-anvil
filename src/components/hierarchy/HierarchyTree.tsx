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
    const horizontalSpacing = viewMode === "heatmap" ? 120 : 220;
    const verticalSpacing = viewMode === "heatmap" ? 120 : 220;

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

    // Build parent-to-children map for visible nodes only
    const visibleAgents = agents.filter(isNodeVisible);
    const childrenMap = new Map<string | null, HierarchyAgent[]>();
    visibleAgents.forEach((agent) => {
      const siblings = childrenMap.get(agent.parentId) || [];
      siblings.push(agent);
      childrenMap.set(agent.parentId, siblings);
    });

    // Sort children by path for consistent ordering
    childrenMap.forEach((children, parentId) => {
      children.sort((a, b) => a.path.localeCompare(b.path));
      childrenMap.set(parentId, children);
    });

    // Calculate subtree widths recursively
    const subtreeWidths = new Map<string, number>();
    const calculateSubtreeWidth = (agentId: string): number => {
      // If node is collapsed, treat it as width 1 (no visible children)
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

    // Calculate widths starting from root nodes
    const rootAgents = visibleAgents.filter((a) => !a.parentId || !agentMap.has(a.parentId));
    rootAgents.forEach((root) => calculateSubtreeWidth(root.id));

    // Position nodes using subtree widths
    const nodePositions = new Map<string, { x: number; y: number }>();

    const positionSubtree = (agent: HierarchyAgent, startX: number) => {
      const subtreeWidth = subtreeWidths.get(agent.id) || 1;
      const centerX = startX + (subtreeWidth * horizontalSpacing) / 2 - horizontalSpacing / 2;
      const y = agent.depth * verticalSpacing;

      nodePositions.set(agent.id, { x: centerX, y });

      // Position children
      const children = childrenMap.get(agent.id) || [];
      let childStartX = startX;
      children.forEach((child) => {
        positionSubtree(child, childStartX);
        const childWidth = subtreeWidths.get(child.id) || 1;
        childStartX += childWidth * horizontalSpacing;
      });
    };

    // Position all root nodes and their subtrees
    let globalStartX = 0;
    rootAgents.forEach((root) => {
      positionSubtree(root, globalStartX);
      const rootWidth = subtreeWidths.get(root.id) || 1;
      globalStartX += rootWidth * horizontalSpacing + horizontalSpacing; // Extra gap between root trees
    });

    // Create nodes with calculated positions
    visibleAgents.forEach((agent) => {
      const position = nodePositions.get(agent.id) || { x: 0, y: 0 };
      const isCollapsed = collapsedNodes.has(agent.id);
      const downlineCount = getDownlineCount(agent.id);

      nodeList.push({
        id: agent.id,
        type: viewMode === "heatmap" ? "heatmap" : "agent",
        position,
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
