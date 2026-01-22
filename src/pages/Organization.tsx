import { useState } from "react";
import { HierarchyTree } from "@/components/hierarchy/HierarchyTree";
import { HierarchySearchBar } from "@/components/hierarchy/HierarchySearchBar";
import { ViewToggle } from "@/components/hierarchy/ViewToggle";
import { useHierarchy } from "@/hooks/useHierarchy";
import { Skeleton } from "@/components/ui/skeleton";
import { Network, Users } from "lucide-react";

export type ViewMode = "standard" | "heatmap";

const Organization = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("standard");
  const [searchQuery, setSearchQuery] = useState("");
  const { agents, loading, error } = useHierarchy();

  // Filter agents based on search query
  const filteredAgents = agents.filter((agent) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      agent.fullName.toLowerCase().includes(query) ||
      agent.email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-4 p-6 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Network className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Organization Hierarchy
            </h1>
            <p className="text-sm text-muted-foreground">
              Visualize and manage your team structure
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <HierarchySearchBar
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-32 w-32 rounded-full" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">Error loading hierarchy</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No agents found</p>
              <p className="text-sm">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Your organization hierarchy will appear here"}
              </p>
            </div>
          </div>
        ) : (
          <HierarchyTree agents={filteredAgents} viewMode={viewMode} />
        )}
      </div>
    </div>
  );
};

export default Organization;
