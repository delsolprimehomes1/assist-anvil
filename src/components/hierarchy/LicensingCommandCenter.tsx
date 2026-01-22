import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle,
  Filter,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EnhancedAgent,
  determineAgentZone,
  zoneColors,
  zoneTailwindClasses,
  zoneDescriptions,
  AgentZone,
} from "@/lib/licensing-logic";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LicensingCommandCenterProps {
  agents: EnhancedAgent[];
}

type SortOption = "urgency" | "name" | "expiry";

export function LicensingCommandCenter({ agents }: LicensingCommandCenterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState<AgentZone | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("urgency");

  // Zone priority for sorting (lower = more urgent)
  const zonePriority: Record<AgentZone, number> = {
    red: 1,
    yellow: 2,
    blue: 3,
    black: 4,
    green: 5,
  };

  // Process and sort agents
  const processedAgents = useMemo(() => {
    let filtered = agents.map((agent) => ({
      ...agent,
      zone: determineAgentZone(agent),
    }));

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.fullName.toLowerCase().includes(query) ||
          a.email.toLowerCase().includes(query)
      );
    }

    // Apply zone filter
    if (zoneFilter !== "all") {
      filtered = filtered.filter((a) => a.zone === zoneFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "urgency":
          return zonePriority[a.zone] - zonePriority[b.zone];
        case "name":
          return a.fullName.localeCompare(b.fullName);
        case "expiry":
          if (!a.residentLicenseExp) return 1;
          if (!b.residentLicenseExp) return -1;
          return new Date(a.residentLicenseExp).getTime() - new Date(b.residentLicenseExp).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [agents, searchQuery, zoneFilter, sortBy]);

  // Zone statistics
  const zoneStats = useMemo(() => {
    const stats: Record<AgentZone, number> = {
      red: 0,
      blue: 0,
      black: 0,
      yellow: 0,
      green: 0,
    };

    agents.forEach((agent) => {
      const zone = determineAgentZone(agent);
      stats[zone]++;
    });

    return stats;
  }, [agents]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysUntil = (dateStr: string | null) => {
    if (!dateStr) return null;
    const days = Math.ceil(
      (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Stats */}
      <div className="grid grid-cols-5 gap-3 p-4 border-b">
        {(Object.keys(zoneStats) as AgentZone[]).map((zone) => (
          <button
            key={zone}
            onClick={() => setZoneFilter(zoneFilter === zone ? "all" : zone)}
            className={cn(
              "p-3 rounded-lg border transition-all text-center",
              zoneFilter === zone
                ? zoneTailwindClasses[zone].border + " ring-2 " + zoneTailwindClasses[zone].glow
                : "hover:bg-muted/50"
            )}
          >
            <div
              className="w-3 h-3 rounded-full mx-auto mb-2"
              style={{ backgroundColor: zoneColors[zone] }}
            />
            <p className="text-2xl font-bold">{zoneStats[zone]}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {zoneDescriptions[zone].label}
            </p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 p-4 border-b">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="urgency">By Urgency</SelectItem>
            <SelectItem value="name">By Name</SelectItem>
            <SelectItem value="expiry">By Expiry Date</SelectItem>
          </SelectContent>
        </Select>
        {zoneFilter !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoneFilter("all")}
          >
            Clear Filter
          </Button>
        )}
      </div>

      {/* Agent List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {processedAgents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No agents found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            processedAgents.map((agent) => {
              const zone = agent.zone;
              const zoneClass = zoneTailwindClasses[zone];
              const daysUntil = getDaysUntil(agent.residentLicenseExp);
              const initials = agent.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={agent.id}
                  className={cn(
                    "p-4 rounded-xl border-2 bg-card transition-all hover:shadow-md",
                    zoneClass.border
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className={cn("h-12 w-12 border-2", zoneClass.border)}>
                      <AvatarImage src={agent.avatarUrl || undefined} />
                      <AvatarFallback
                        style={{ backgroundColor: zoneColors[zone] + "20" }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {agent.fullName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {agent.email}
                          </p>
                        </div>
                        <Badge
                          style={{
                            backgroundColor: zoneColors[zone],
                            color: "white",
                          }}
                        >
                          {zoneDescriptions[zone].label}
                        </Badge>
                      </div>

                      {/* License info row */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">
                            License Expiry
                          </p>
                          <p
                            className={cn(
                              "font-medium",
                              daysUntil !== null && daysUntil <= 7 && "text-red-500",
                              daysUntil !== null && daysUntil > 7 && daysUntil <= 30 && "text-amber-500"
                            )}
                          >
                            {formatDate(agent.residentLicenseExp)}
                            {daysUntil !== null && daysUntil >= 0 && (
                              <span className="text-xs ml-1">
                                ({daysUntil}d)
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">
                            Contracts
                          </p>
                          <p className="font-medium">
                            {agent.contractsApproved} approved
                            {agent.contractsPending > 0 && (
                              <span className="text-amber-500 ml-1">
                                +{agent.contractsPending}
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">
                            Verification
                          </p>
                          {agent.verificationComplete ? (
                            <Badge variant="default" className="h-5">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="h-5">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* License states */}
                      {agent.licenseStates.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {agent.licenseStates.slice(0, 6).map((state) => (
                            <Badge
                              key={state}
                              variant="outline"
                              className="text-xs"
                            >
                              {state}
                            </Badge>
                          ))}
                          {agent.licenseStates.length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{agent.licenseStates.length - 6}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
