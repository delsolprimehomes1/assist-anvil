import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useZoneConfig, ZoneConfig } from "@/hooks/useZoneConfig";
import { Loader2 } from "lucide-react";

interface ZoneConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditableZone {
  id: string;
  zone_key: string;
  label: string;
  description: string;
  color: string;
}

export function ZoneConfigModal({ open, onOpenChange }: ZoneConfigModalProps) {
  const { zoneConfigs, updating, updateAllZoneConfigs } = useZoneConfig();
  const [editedZones, setEditedZones] = useState<EditableZone[]>([]);

  // Initialize editable zones when configs load or modal opens
  useEffect(() => {
    if (open && zoneConfigs.length > 0) {
      setEditedZones(
        zoneConfigs.map((config) => ({
          id: config.id,
          zone_key: config.zone_key,
          label: config.label,
          description: config.description,
          color: config.color,
        }))
      );
    }
  }, [open, zoneConfigs]);

  const handleLabelChange = (zoneKey: string, value: string) => {
    setEditedZones((prev) =>
      prev.map((z) => (z.zone_key === zoneKey ? { ...z, label: value } : z))
    );
  };

  const handleDescriptionChange = (zoneKey: string, value: string) => {
    setEditedZones((prev) =>
      prev.map((z) => (z.zone_key === zoneKey ? { ...z, description: value } : z))
    );
  };

  const handleSave = async () => {
    await updateAllZoneConfigs(
      editedZones.map((z) => ({
        id: z.id,
        label: z.label,
        description: z.description,
      }))
    );
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset to original values
    setEditedZones(
      zoneConfigs.map((config) => ({
        id: config.id,
        zone_key: config.zone_key,
        label: config.label,
        description: config.description,
        color: config.color,
      }))
    );
    onOpenChange(false);
  };

  const zoneDisplayNames: Record<string, string> = {
    producing: "Producing Zone",
    investing: "Investing Zone",
    red: "Red Zone",
    blue: "Blue Zone",
    black: "Black Zone",
    yellow: "Yellow Zone",
    green: "Green Zone",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Zone Meanings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {editedZones.map((zone) => (
            <div
              key={zone.zone_key}
              className="space-y-3 p-4 rounded-lg border bg-muted/30"
            >
              {/* Zone Header with Color */}
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                  style={{ backgroundColor: zone.color }}
                />
                <span className="font-semibold">
                  {zoneDisplayNames[zone.zone_key] || zone.zone_key}
                </span>
              </div>

              {/* Label Input */}
              <div className="space-y-1.5">
                <Label htmlFor={`label-${zone.zone_key}`} className="text-xs">
                  Display Name
                </Label>
                <Input
                  id={`label-${zone.zone_key}`}
                  value={zone.label}
                  onChange={(e) => handleLabelChange(zone.zone_key, e.target.value)}
                  placeholder="Enter label..."
                  className="h-9"
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <Label htmlFor={`desc-${zone.zone_key}`} className="text-xs">
                  Meaning / Description
                </Label>
                <Textarea
                  id={`desc-${zone.zone_key}`}
                  value={zone.description}
                  onChange={(e) => handleDescriptionChange(zone.zone_key, e.target.value)}
                  placeholder="Describe what this zone means..."
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={updating}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updating}>
            {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
