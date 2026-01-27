import { LayoutGrid, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewMode } from "@/pages/Organization";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const ViewToggle = ({ mode, onChange }: ViewToggleProps) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("standard")}
        className={cn(
          "gap-2 transition-all",
          mode === "standard"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Standard</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("heatmap")}
        className={cn(
          "gap-2 transition-all",
          mode === "heatmap"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Flame className="h-4 w-4" />
        <span className="hidden sm:inline">Heat Map</span>
      </Button>
    </div>
  );
};
