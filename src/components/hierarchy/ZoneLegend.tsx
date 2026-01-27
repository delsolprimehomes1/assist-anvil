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
import { motion, AnimatePresence } from "framer-motion";

export function ZoneLegend() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { zoneConfigs, loading } = useZoneConfig();
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();

  if (loading) return null;

  const showCollapsed = isMobile ? !isCollapsed : isCollapsed;

  return (
    <>
      {/* Premium Floating Legend Panel */}
      <motion.div 
        className="absolute top-4 right-4 z-10"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.div
          className="glass-premium-strong overflow-hidden"
          animate={{ width: showCollapsed ? 64 : 240 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{
            boxShadow: 'var(--shadow-premium-lg), var(--glow-soft)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-white/5">
            <AnimatePresence>
              {!showCollapsed && (
                <motion.h3 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-bold text-xs uppercase tracking-[0.2em] text-foreground/80"
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
                  className="h-7 w-7 hover:bg-white/10 rounded-lg"
                  onClick={() => setEditModalOpen(true)}
                >
                  <Settings className="h-4 w-4 text-foreground/60" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-white/10 rounded-lg"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {showCollapsed ? (
                  <ChevronLeft className="h-4 w-4 text-foreground/60" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-foreground/60" />
                )}
              </Button>
            </div>
          </div>

          {/* Zone List */}
          <div className="p-2 max-h-[60vh] overflow-y-auto scrollbar-hide">
            <TooltipProvider delayDuration={0}>
              {zoneConfigs.map((config, index) => (
                <motion.div 
                  key={config.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {showCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div 
                          className="flex justify-center p-2 cursor-pointer rounded-xl transition-colors hover:bg-white/5"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: config.color,
                              boxShadow: `0 0 20px ${config.color}60, inset 0 1px 1px rgba(255,255,255,0.2)`,
                            }}
                          />
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="left" 
                        className="glass-premium-strong border-0 max-w-[200px]"
                        style={{ boxShadow: 'var(--shadow-premium)' }}
                      >
                        <p className="font-semibold text-foreground">{config.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <motion.div 
                      className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-white/5 cursor-default"
                      whileHover={{ x: 2 }}
                    >
                      {/* Premium color orb with glow */}
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
                        style={{
                          backgroundColor: config.color,
                          boxShadow: `0 0 20px ${config.color}60, inset 0 1px 1px rgba(255,255,255,0.2)`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground/95 leading-tight tracking-tight">
                          {config.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
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
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-2 border-t border-white/5"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs hover:bg-white/10 rounded-xl h-9"
                  onClick={() => setEditModalOpen(true)}
                >
                  <Settings className="h-3 w-3 mr-1.5" />
                  Customize
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Edit Modal */}
      <ZoneConfigModal open={editModalOpen} onOpenChange={setEditModalOpen} />
    </>
  );
}
