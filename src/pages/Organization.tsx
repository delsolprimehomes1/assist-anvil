import { useState } from "react";
import { HierarchyTree } from "@/components/hierarchy/HierarchyTree";
import { HierarchySearchBar } from "@/components/hierarchy/HierarchySearchBar";
import { ViewToggle } from "@/components/hierarchy/ViewToggle";
import { ProductionGalaxy } from "@/components/hierarchy/galaxy/ProductionGalaxy";
import { LicensingCommandCenter } from "@/components/hierarchy/LicensingCommandCenter";
import { AddAgentModal } from "@/components/hierarchy/AddAgentModal";
import { useHierarchy } from "@/hooks/useHierarchy";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, Users, Sparkles, Shield, UserPlus } from "lucide-react";
import { EnhancedAgent } from "@/lib/licensing-logic";

export type ViewMode = "standard" | "heatmap" | "galaxy";

const Organization = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("standard");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("hierarchy");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { agents, loading, error, refetch } = useHierarchy();

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Network className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Agent Command OS
              </h1>
              <p className="text-sm text-muted-foreground">
                Visualize, manage, and monitor your team
              </p>
            </div>
          </div>
          <Button onClick={() => setAddModalOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Agent
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList className="grid w-full sm:w-auto grid-cols-3">
              <TabsTrigger value="hierarchy" className="gap-2">
                <Network className="h-4 w-4" />
                <span className="hidden sm:inline">Hierarchy</span>
              </TabsTrigger>
              <TabsTrigger value="galaxy" className="gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Galaxy</span>
              </TabsTrigger>
              <TabsTrigger value="licensing" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Licensing</span>
              </TabsTrigger>
            </TabsList>

            {/* Controls for hierarchy tab */}
            {activeTab === "hierarchy" && (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
                <HierarchySearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                />
                <ViewToggle mode={viewMode} onChange={setViewMode} />
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-32 w-32 rounded-full" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">Error loading hierarchy</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No agents found</p>
              <p className="text-sm mb-4">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Start by adding agents to your organization"}
              </p>
              <Button onClick={() => setAddModalOpen(true)} variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First Agent
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} className="absolute inset-0">
            <TabsContent value="hierarchy" className="absolute inset-0 m-0">
              {viewMode === "galaxy" ? (
                <ProductionGalaxy agents={filteredAgents as EnhancedAgent[]} />
              ) : (
                <HierarchyTree agents={filteredAgents} viewMode={viewMode} />
              )}
            </TabsContent>
            <TabsContent value="galaxy" className="absolute inset-0 m-0">
              <ProductionGalaxy agents={filteredAgents as EnhancedAgent[]} />
            </TabsContent>
            <TabsContent value="licensing" className="absolute inset-0 m-0 overflow-auto">
              <LicensingCommandCenter agents={filteredAgents as EnhancedAgent[]} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Add Agent Modal */}
      <AddAgentModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAgentAdded={refetch}
      />
    </div>
  );
};

export default Organization;
