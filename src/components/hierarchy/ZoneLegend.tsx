import { useState } from "react";
import { Settings, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useZoneConfig } from "@/hooks/useZoneConfig";
import { useAdmin } from "@/hooks/useAdmin";
import { ZoneConfigModal } from "./ZoneConfigModal";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ZoneLegend() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { zoneConfigs, loading } = useZoneConfig();
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();

  if (loading) return null;

  // On mobile, default to collapsed icon strip
  const showCollapsed = isMobile ? !isCollapsed : isCollapsed;

  return (
    <>
      {/* Always-visible Legend Panel */}
      <div className="absolute top-4 right-4 z-10">
        <div
          className={`
            bg-card/95 backdrop-blur-md rounded-xl shadow-xl border-2 border-border/50
            transition-all duration-300 ease-in-out overflow-hidden
            ${showCollapsed ? "w-16" : "w-56"}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
            {!showCollapsed && (
              <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">
                Status Key
              </h3>
            )}
            <div className="flex items-center gap-1 ml-auto">
              {isAdmin && !showCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditModalOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {showCollapsed ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Zone List */}
          <div className="p-2">
            <TooltipProvider delayDuration={0}>
              {zoneConfigs.map((config) => (
                <div key={config.id}>
                  {showCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-center p-2 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors">
                          <div
                            className="w-8 h-8 rounded-full flex-shrink-0 border-2 border-background shadow-lg"
                            style={{
                              backgroundColor: config.color,
                              boxShadow: `0 0 12px ${config.color}60`,
                            }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[200px]">
                        <p className="font-semibold">{config.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                      {/* Large color indicator with glow */}
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5 border-2 border-background shadow-lg"
                        style={{
                          backgroundColor: config.color,
                          boxShadow: `0 0 12px ${config.color}60`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground leading-tight">
                          {config.label}
                        </p>
                        <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                          {config.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </TooltipProvider>
          </div>

          {/* Admin Footer */}
          {isAdmin && !showCollapsed && (
            <div className="p-2 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setEditModalOpen(true)}
              >
                <Settings className="h-3 w-3 mr-1" />
                Customize Meanings
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <ZoneConfigModal open={editModalOpen} onOpenChange={setEditModalOpen} />
    </>
  );
}
