import { useState } from "react";
import { Settings, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useZoneConfig } from "@/hooks/useZoneConfig";
import { useAdmin } from "@/hooks/useAdmin";
import { ZoneConfigModal } from "./ZoneConfigModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
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
      {/* Sleek Frosted Glass Legend Panel */}
      <div className="absolute top-4 right-4 z-10">
        <motion.div
          layout
          className="overflow-hidden rounded-2xl"
          style={{
            background: "hsl(var(--background) / 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid hsl(var(--border) / 0.5)",
            boxShadow: `
              0 25px 50px -12px rgba(0, 0, 0, 0.25),
              0 12px 24px -8px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
          }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ 
            opacity: 1, 
            x: 0,
            width: showCollapsed ? 64 : 224,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-3 py-3 border-b"
            style={{ borderColor: "hsl(var(--border) / 0.3)" }}
          >
            <AnimatePresence mode="wait">
              {!showCollapsed && (
                <motion.h3 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-bold text-xs uppercase tracking-widest text-foreground/80"
                >
                  Status Key
                </motion.h3>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-1 ml-auto">
              {isAdmin && !showCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  onClick={() => setEditModalOpen(true)}
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
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
              {zoneConfigs.map((config, index) => (
                <motion.div 
                  key={config.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  {showCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div 
                          className="flex justify-center p-2 cursor-pointer rounded-xl transition-all duration-200 hover:bg-muted/50"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {/* 3D Pill Color Indicator */}
                          <div
                            className="w-8 h-8 rounded-full flex-shrink-0"
                            style={{
                              background: `
                                radial-gradient(ellipse 60% 40% at 50% 20%, rgba(255,255,255,0.4) 0%, transparent 50%),
                                radial-gradient(ellipse 80% 50% at 50% 85%, rgba(0,0,0,0.15) 0%, transparent 50%),
                                ${config.color}
                              `,
                              boxShadow: `
                                0 0 0 2px hsl(var(--background)),
                                0 0 16px ${config.color}50,
                                inset 0 2px 4px rgba(255,255,255,0.3),
                                inset 0 -2px 4px rgba(0,0,0,0.2)
                              `,
                            }}
                          />
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[200px] bg-popover/95 backdrop-blur-lg">
                        <p className="font-semibold">{config.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <motion.div 
                      className="flex items-start gap-3 p-2.5 rounded-xl transition-all duration-200 hover:bg-muted/40 group cursor-default"
                      whileHover={{ x: 2 }}
                    >
                      {/* 3D Pill Color Indicator */}
                      <div
                        className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5 transition-all duration-300 group-hover:scale-110"
                        style={{
                          background: `
                            radial-gradient(ellipse 60% 40% at 50% 20%, rgba(255,255,255,0.4) 0%, transparent 50%),
                            radial-gradient(ellipse 80% 50% at 50% 85%, rgba(0,0,0,0.15) 0%, transparent 50%),
                            ${config.color}
                          `,
                          boxShadow: `
                            0 0 0 2px hsl(var(--background)),
                            0 0 14px ${config.color}40,
                            inset 0 2px 4px rgba(255,255,255,0.3),
                            inset 0 -2px 4px rgba(0,0,0,0.2)
                          `,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground leading-tight">
                          {config.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                          {config.description}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </TooltipProvider>
          </div>

          {/* Admin Footer */}
          <AnimatePresence>
            {isAdmin && !showCollapsed && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-2 pb-2"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8 rounded-xl border-border/50 bg-muted/30 hover:bg-muted/60 transition-all"
                  onClick={() => setEditModalOpen(true)}
                >
                  <Settings className="h-3 w-3 mr-1.5" />
                  Customize
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Edit Modal */}
      <ZoneConfigModal open={editModalOpen} onOpenChange={setEditModalOpen} />
    </>
  );
}
