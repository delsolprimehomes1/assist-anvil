import { X, Mail, Phone, MapPin, TrendingUp, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  EnhancedAgent,
  determineAgentZone,
  zoneColors,
  zoneTailwindClasses,
  zoneDescriptions,
} from "@/lib/licensing-logic";
import { cn } from "@/lib/utils";

interface AgentDetailPanelProps {
  agent: EnhancedAgent;
  onClose: () => void;
}

export function AgentDetailPanel({ agent, onClose }: AgentDetailPanelProps) {
  const zone = determineAgentZone(agent);
  const zoneInfo = zoneDescriptions[zone];
  const zoneClasses = zoneTailwindClasses[zone];
  const goalProgress = Math.min((agent.ytdPremium / agent.monthlyGoal) * 100, 100);

  const initials = agent.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Format date helper
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Days until license expires
  const daysUntilExpiry = agent.residentLicenseExp
    ? Math.ceil(
        (new Date(agent.residentLicenseExp).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="absolute top-4 right-4 w-80 bg-background/95 backdrop-blur-md border rounded-xl shadow-2xl overflow-hidden">
      {/* Header with zone color accent */}
      <div
        className="h-2"
        style={{ backgroundColor: zoneColors[zone] }}
      />
      
      <div className="p-4">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Agent info */}
        <div className="flex items-start gap-3 mb-4">
          <Avatar className={cn("h-14 w-14 border-2", zoneClasses.border)}>
            <AvatarImage src={agent.avatarUrl || undefined} />
            <AvatarFallback
              className="text-lg font-semibold"
              style={{ backgroundColor: zoneColors[zone] + "20" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="font-semibold text-foreground truncate">
              {agent.fullName}
            </h3>
            <p className="text-sm text-muted-foreground capitalize">
              {agent.tier.replace("_", " ")}
            </p>
            <Badge
              className={cn("mt-1 text-xs", zoneClasses.bg)}
              style={{ color: "white" }}
            >
              {zoneInfo.label} Zone
            </Badge>
          </div>
        </div>

        {/* Zone description */}
        <div
          className={cn(
            "p-3 rounded-lg mb-4 text-sm",
            zone === "red" && "bg-red-500/10 text-red-600",
            zone === "blue" && "bg-blue-500/10 text-blue-600",
            zone === "black" && "bg-slate-500/10 text-slate-600",
            zone === "yellow" && "bg-amber-500/10 text-amber-600",
            zone === "green" && "bg-emerald-500/10 text-emerald-600"
          )}
        >
          {zoneInfo.description}
        </div>

        {/* Performance metrics */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                Goal Progress
              </span>
              <span className="font-medium">{goalProgress.toFixed(0)}%</span>
            </div>
            <Progress value={goalProgress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs mb-1">YTD Premium</p>
              <p className="font-semibold text-foreground">
                ${agent.ytdPremium.toLocaleString()}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs mb-1">Monthly Goal</p>
              <p className="font-semibold text-foreground">
                ${agent.monthlyGoal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* License info */}
          <div className="border-t pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Compliance Status
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">License Expires</span>
                <span
                  className={cn(
                    "font-medium",
                    daysUntilExpiry !== null && daysUntilExpiry <= 7 && "text-red-500",
                    daysUntilExpiry !== null && daysUntilExpiry > 7 && daysUntilExpiry <= 30 && "text-amber-500"
                  )}
                >
                  {formatDate(agent.residentLicenseExp)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CE Due Date</span>
                <span className="font-medium">{formatDate(agent.ceDueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contracts</span>
                <span className="font-medium">
                  {agent.contractsApproved} approved
                  {agent.contractsPending > 0 && (
                    <span className="text-amber-500 ml-1">
                      ({agent.contractsPending} pending)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verification</span>
                <Badge variant={agent.verificationComplete ? "default" : "secondary"}>
                  {agent.verificationComplete ? "Complete" : "Pending"}
                </Badge>
              </div>
            </div>
          </div>

          {/* License states */}
          {agent.licenseStates.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Licensed States
              </h4>
              <div className="flex flex-wrap gap-1">
                {agent.licenseStates.map((state) => (
                  <Badge key={state} variant="outline" className="text-xs">
                    {state}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="border-t pt-4 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href={`mailto:${agent.email}`}>
                <Mail className="h-4 w-4 mr-1" />
                Email
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
