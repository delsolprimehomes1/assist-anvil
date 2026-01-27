import { useState } from "react";
import { HelpCircle, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useZoneConfig } from "@/hooks/useZoneConfig";
import { useAdmin } from "@/hooks/useAdmin";
import { ZoneConfigModal } from "./ZoneConfigModal";
import { cn } from "@/lib/utils";

export function ZoneLegend() {
  const [isOpen, setIsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { zoneConfigs, loading } = useZoneConfig();
  const { isAdmin } = useAdmin();

  if (loading) return null;

  return (
    <>
      {/* Toggle Button */}
      <div className="absolute bottom-4 right-4 z-10">
        {!isOpen ? (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-10 w-10 rounded-full shadow-lg bg-card/90 backdrop-blur-sm border"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        ) : (
          <div className="w-64 bg-card/95 backdrop-blur-sm rounded-lg shadow-xl border animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold text-sm">Agent Status Legend</h3>
              <div className="flex items-center gap-1">
                {isAdmin && (
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
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Zone List */}
            <div className="p-2 max-h-80 overflow-y-auto">
              {zoneConfigs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  {/* Color indicator */}
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 border-2 border-background shadow-sm"
                    style={{ backgroundColor: config.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">
                      {config.label}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {config.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            {isAdmin && (
              <div className="p-2 border-t">
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
        )}
      </div>

      {/* Edit Modal */}
      <ZoneConfigModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
      />
    </>
  );
}
