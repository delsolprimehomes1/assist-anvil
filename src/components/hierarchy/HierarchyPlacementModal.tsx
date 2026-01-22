import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GitBranch, ArrowDown, AlertTriangle, Loader2, Users } from "lucide-react";
import { EnhancedAgent, determineAgentZone, zoneColors } from "@/lib/licensing-logic";
import { cn } from "@/lib/utils";

interface HierarchyPlacementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: EnhancedAgent[];
  onMove: (agentUserId: string, newParentUserId: string) => Promise<void>;
  isMoving: boolean;
}

export const HierarchyPlacementModal = ({
  open,
  onOpenChange,
  agents,
  onMove,
  isMoving,
}: HierarchyPlacementModalProps) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Get the selected agent object
  const selectedAgent = useMemo(
    () => agents.find((a) => a.userId === selectedAgentId),
    [agents, selectedAgentId]
  );

  // Get the selected manager object
  const selectedManager = useMemo(
    () => agents.find((a) => a.userId === selectedManagerId),
    [agents, selectedManagerId]
  );

  // Calculate downline count for the selected agent
  const downlineCount = useMemo(() => {
    if (!selectedAgent) return 0;
    return agents.filter(
      (a) => a.path.startsWith(selectedAgent.path + ".") && a.id !== selectedAgent.id
    ).length;
  }, [agents, selectedAgent]);

  // Get available managers (exclude selected agent and their descendants)
  const availableManagers = useMemo(() => {
    if (!selectedAgent) return agents;
    return agents.filter((a) => {
      // Exclude the agent being moved
      if (a.userId === selectedAgentId) return false;
      // Exclude descendants of the selected agent (circular reference prevention)
      if (a.path.startsWith(selectedAgent.path + ".")) return false;
      // Exclude current parent (no point in moving to same parent)
      if (a.userId === selectedAgent.parentId) return false;
      return true;
    });
  }, [agents, selectedAgent, selectedAgentId]);

  // Get initials from name
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  // Handle the move action
  const handleMove = async () => {
    if (!selectedAgentId || !selectedManagerId) return;
    setError(null);

    try {
      await onMove(selectedAgentId, selectedManagerId);
      // Success - close modal and reset state
      setSelectedAgentId("");
      setSelectedManagerId("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move agent");
    }
  };

  // Reset state when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedAgentId("");
      setSelectedManagerId("");
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-md border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Reassign Agent
          </DialogTitle>
          <DialogDescription>
            Move an agent and their entire downline to a new manager
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Select Agent */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Select Agent to Move
            </label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an agent..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {agents.map((agent) => {
                  const zone = determineAgentZone(agent);
                  return (
                    <SelectItem key={agent.userId} value={agent.userId}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={agent.avatarUrl || undefined} />
                          <AvatarFallback
                            className="text-xs"
                            style={{ backgroundColor: `${zoneColors[zone]}20` }}
                          >
                            {getInitials(agent.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{agent.fullName}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          ({agent.tier.replace("_", " ")})
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Visual Arrow */}
          {selectedAgentId && (
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <ArrowDown className="h-6 w-6" />
                <span className="text-xs">Move to</span>
              </div>
            </div>
          )}

          {/* Select New Manager */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Select New Manager
            </label>
            <Select
              value={selectedManagerId}
              onValueChange={setSelectedManagerId}
              disabled={!selectedAgentId}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    selectedAgentId
                      ? "Choose a new manager..."
                      : "Select an agent first"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {availableManagers.map((agent) => {
                  const zone = determineAgentZone(agent);
                  return (
                    <SelectItem key={agent.userId} value={agent.userId}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={agent.avatarUrl || undefined} />
                          <AvatarFallback
                            className="text-xs"
                            style={{ backgroundColor: `${zoneColors[zone]}20` }}
                          >
                            {getInitials(agent.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{agent.fullName}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          ({agent.tier.replace("_", " ")})
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Cards */}
          {selectedAgent && selectedManager && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                {/* Agent being moved */}
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-2">Moving</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedAgent.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(selectedAgent.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[100px]">
                        {selectedAgent.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {selectedAgent.tier.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* New manager */}
                <div className="p-3 rounded-lg border bg-primary/5 border-primary/20">
                  <p className="text-xs text-muted-foreground mb-2">New Manager</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedManager.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(selectedManager.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[100px]">
                        {selectedManager.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {selectedManager.tier.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Downline Warning */}
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-sm">
                  <span className="font-medium">{selectedAgent.fullName}</span>
                  {downlineCount > 0 ? (
                    <>
                      {" "}and{" "}
                      <span className="font-medium">{downlineCount} agent{downlineCount !== 1 ? "s" : ""}</span>
                      {" "}in their downline
                    </>
                  ) : null}{" "}
                  will be moved under{" "}
                  <span className="font-medium">{selectedManager.fullName}</span>.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isMoving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={!selectedAgentId || !selectedManagerId || isMoving}
            className="gap-2"
          >
            {isMoving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Moving...
              </>
            ) : (
              <>
                <GitBranch className="h-4 w-4" />
                Confirm Move
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
