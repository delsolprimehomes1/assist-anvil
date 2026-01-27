import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Percent, Calculator } from "lucide-react";

interface LeadPurchaseSectionProps {
  leadsPurchased: number;
  discountPercent: number;
  costPerLead: number;
  totalLeadCost: number;
  onLeadsPurchasedChange: (value: number) => void;
  onDiscountChange: (value: number) => void;
}

export const LeadPurchaseSection = ({
  leadsPurchased,
  discountPercent,
  costPerLead,
  totalLeadCost,
  onLeadsPurchasedChange,
  onDiscountChange,
}: LeadPurchaseSectionProps) => {
  const originalCost = leadsPurchased * costPerLead;
  const savings = originalCost - totalLeadCost;

  return (
    <div className="pt-2 border-t">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
        <ShoppingCart className="h-4 w-4" />
        Lead Purchase
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="leadsPurchased">Leads Purchased</Label>
          <Input
            id="leadsPurchased"
            type="number"
            min="0"
            value={leadsPurchased}
            onChange={(e) => onLeadsPurchasedChange(parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discountPercent" className="flex items-center gap-1">
            <Percent className="h-3 w-3" />
            Discount Code %
          </Label>
          <Input
            id="discountPercent"
            type="number"
            min="0"
            max="100"
            step="1"
            value={discountPercent}
            onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
            placeholder="0, 5, 10..."
          />
        </div>
      </div>
      
      {leadsPurchased > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <Calculator className="h-4 w-4 text-primary" />
            Total Lead Cost
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              ${totalLeadCost.toFixed(2)}
            </span>
            {discountPercent > 0 && (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  ${originalCost.toFixed(2)}
                </span>
                <span className="text-xs text-green-600 font-medium">
                  Save ${savings.toFixed(2)}
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {leadsPurchased} leads × ${costPerLead.toFixed(2)}/lead
            {discountPercent > 0 && ` × ${100 - discountPercent}%`}
          </p>
        </div>
      )}
    </div>
  );
};
