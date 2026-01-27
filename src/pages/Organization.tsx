import { useState } from "react";
import { HierarchyTree } from "@/components/hierarchy/HierarchyTree";
import { HierarchySearchBar } from "@/components/hierarchy/HierarchySearchBar";
import { ViewToggle } from "@/components/hierarchy/ViewToggle";
import { LicensingCommandCenter } from "@/components/hierarchy/LicensingCommandCenter";
import { AddAgentModal } from "@/components/hierarchy/AddAgentModal";
import { HierarchyPlacementModal } from "@/components/hierarchy/HierarchyPlacementModal";
import { MyInvitationsList } from "@/components/hierarchy/MyInvitationsList";
import { useHierarchy } from "@/hooks/useHierarchy";
import { useAdmin } from "@/hooks/useAdmin";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Network, Users, Shield, UserPlus, GitBranch, Mail } from "lucide-react";
import { ZoneLegend } from "@/components/hierarchy/ZoneLegend";
import { EnhancedAgent } from "@/lib/licensing-logic";
import { useToast } from "@/hooks/use-toast";

export type ViewMode = "standard" | "heatmap";

const Organization = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("standard");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("hierarchy");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [placementModalOpen, setPlacementModalOpen] = useState(false);
  const { agents, loading, error, refetch, moveAgent, isMoving } = useHierarchy();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();

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
    <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Compact Mobile Header */}
      <div className="flex flex-col gap-3 p-4 sm:p-6 border-b bg-background">
        {/* Title Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
              <Network className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold truncate">
                Command Center
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Manage your team
              </p>
            </div>
          </div>
          
          {/* Action Buttons - Compact on mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPlacementModalOpen(true)}
                className="h-8 sm:h-9 px-2 sm:px-3 gap-1 sm:gap-2"
              >
                <GitBranch className="h-4 w-4" />
                <span className="hidden sm:inline">Reassign</span>
              </Button>
            )}
            <Button 
              onClick={() => setAddModalOpen(true)} 
              size="sm"
              className="h-8 sm:h-9 px-2 sm:px-3 gap-1 sm:gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Invite</span>
            </Button>
          </div>
        </div>

        {/* Tabs - Scrollable on mobile */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col gap-3">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex w-auto min-w-full sm:w-auto h-10 sm:h-11">
                <TabsTrigger value="hierarchy" className="gap-1.5 text-xs sm:text-sm px-3 sm:px-4">
                  <Network className="h-4 w-4" />
                  <span>Hierarchy</span>
                </TabsTrigger>
                <TabsTrigger value="licensing" className="gap-1.5 text-xs sm:text-sm px-3 sm:px-4">
                  <Shield className="h-4 w-4" />
                  <span>Licensing</span>
                </TabsTrigger>
                <TabsTrigger value="invitations" className="gap-1.5 text-xs sm:text-sm px-3 sm:px-4">
                  <Mail className="h-4 w-4" />
                  <span>Invites</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Controls for hierarchy tab - Stack on mobile */}
            {activeTab === "hierarchy" && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <div className="flex-1">
                  <HierarchySearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                  />
                </div>
                <ViewToggle mode={viewMode} onChange={setViewMode} />
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-20 w-20 sm:h-32 sm:w-32 rounded-full" />
              <Skeleton className="h-4 w-32 sm:w-48" />
              <Skeleton className="h-4 w-24 sm:w-32" />
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center text-muted-foreground">
              <p className="text-base sm:text-lg font-medium">Error loading hierarchy</p>
              <p className="text-xs sm:text-sm">{error}</p>
            </div>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
              <p className="text-base sm:text-lg font-medium">No agents found</p>
              <p className="text-xs sm:text-sm mb-4">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Start by adding agents"}
              </p>
              <Button onClick={() => setAddModalOpen(true)} variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite First Agent
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} className="absolute inset-0">
            <TabsContent value="hierarchy" className="absolute inset-0 m-0">
              <HierarchyTree agents={filteredAgents} viewMode={viewMode} />
              <ZoneLegend />
            </TabsContent>
            <TabsContent value="licensing" className="absolute inset-0 m-0 overflow-auto">
              <LicensingCommandCenter agents={filteredAgents as EnhancedAgent[]} />
            </TabsContent>
            <TabsContent value="invitations" className="absolute inset-0 m-0 overflow-auto p-4 sm:p-6">
              <Card className="max-w-2xl mx-auto">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    My Invitations
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Track invitations sent to new team members
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <MyInvitationsList />
                </CardContent>
              </Card>
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

      {/* Hierarchy Placement Modal (Admin Only) */}
      <HierarchyPlacementModal
        open={placementModalOpen}
        onOpenChange={setPlacementModalOpen}
        agents={agents as EnhancedAgent[]}
        onMove={async (agentUserId, newParentUserId) => {
          await moveAgent(agentUserId, newParentUserId);
          toast({
            title: "Agent reassigned",
            description: "The agent and their downline have been moved successfully.",
          });
        }}
        isMoving={isMoving}
      />
    </div>
  );
};

export default Organization;
