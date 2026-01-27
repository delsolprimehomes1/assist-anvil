import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PerformanceEntry } from "@/hooks/useAgentPerformance";
import { Loader2, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface EditEntryDialogProps {
  entry: PerformanceEntry | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<PerformanceEntry>) => Promise<void>;
}

const COMP_LEVELS = [70, 80, 90, 100, 115, 125, 140];
const ADVANCEMENT_LEVELS = [75, 80, 85, 90, 100];

export function EditEntryDialog({ entry, open, onClose, onSave }: EditEntryDialogProps) {
  const [saving, setSaving] = useState(false);
  const [clientsClosed, setClientsClosed] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [compLevelPercent, setCompLevelPercent] = useState(100);
  const [advancementPercent, setAdvancementPercent] = useState(75);
  const [notes, setNotes] = useState("");

  // Reset form when entry changes
  useEffect(() => {
    if (entry) {
      setClientsClosed(entry.clientsClosed);
      setRevenue(entry.revenue);
      setCompLevelPercent(entry.compLevelPercent);
      setAdvancementPercent(entry.advancementPercent);
      setNotes(entry.notes || "");
    }
  }, [entry]);

  // Real-time calculations
  const calculations = useMemo(() => {
    const issuePay = revenue * (compLevelPercent / 100) * (advancementPercent / 100);
    const deferredPay = revenue * (compLevelPercent / 100) * (1 - advancementPercent / 100);
    const leadCost = entry?.totalLeadCost || 0;
    const netProfit = issuePay - leadCost;

    return { issuePay, deferredPay, netProfit, leadCost };
  }, [revenue, compLevelPercent, advancementPercent, entry?.totalLeadCost]);

  const handleSave = async () => {
    if (!entry) return;

    setSaving(true);
    try {
      await onSave(entry.id, {
        clientsClosed,
        revenue,
        compLevelPercent,
        advancementPercent,
        expectedIssuePay: calculations.issuePay,
        expectedDeferredPay: calculations.deferredPay,
        notes: notes || null,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save entry:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Performance Entry</DialogTitle>
          <DialogDescription>
            Adjust numbers for declines or issued business changes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Entry Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <span>Date: {new Date(entry.entryDate).toLocaleDateString()}</span>
            <span>Lead Type: {entry.leadType}</span>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Results</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientsClosed">Clients Closed</Label>
                <Input
                  id="clientsClosed"
                  type="number"
                  min="0"
                  value={clientsClosed}
                  onChange={(e) => setClientsClosed(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="revenue">Annual Premium ($)</Label>
                <Input
                  id="revenue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={revenue}
                  onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Commission Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Commission Settings</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="compLevel">Comp Level %</Label>
                <Select
                  value={compLevelPercent.toString()}
                  onValueChange={(val) => setCompLevelPercent(parseInt(val))}
                >
                  <SelectTrigger id="compLevel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMP_LEVELS.map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        {level}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="advancement">Advancement %</Label>
                <Select
                  value={advancementPercent.toString()}
                  onValueChange={(val) => setAdvancementPercent(parseInt(val))}
                >
                  <SelectTrigger id="advancement">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADVANCEMENT_LEVELS.map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        {level}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Calculated Values */}
          <div className="space-y-3 bg-muted/30 p-4 rounded-lg border">
            <h4 className="font-medium text-sm">Calculated Values</h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Issue Pay:</span>
                <span className="font-semibold">${calculations.issuePay.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Deferred:</span>
                <span className="font-semibold">${calculations.deferredPay.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-muted-foreground">Lead Cost:</span>
                <span className="font-semibold">${calculations.leadCost.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {calculations.netProfit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className="text-muted-foreground">Net:</span>
                <span className={`font-semibold ${calculations.netProfit >= 0 ? "text-green-500" : "text-destructive"}`}>
                  ${calculations.netProfit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (decline reason, adjustments, etc.)</Label>
            <Textarea
              id="notes"
              placeholder="e.g., 1 decline - health history issue"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
