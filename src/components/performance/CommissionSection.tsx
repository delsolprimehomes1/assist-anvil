import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BadgeDollarSign, TrendingUp, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CommissionSectionProps {
  revenue: number;
  compLevelPercent: number;
  advancementPercent: number;
  expectedIssuePay: number;
  expectedDeferredPay: number;
  onCompLevelChange: (value: number) => void;
  onAdvancementChange: (value: number) => void;
}

const COMP_LEVELS = [70, 80, 90, 100, 115, 125, 140];
const ADVANCEMENT_LEVELS = [75, 80, 85, 90, 100];

export const CommissionSection = ({
  revenue,
  compLevelPercent,
  advancementPercent,
  expectedIssuePay,
  expectedDeferredPay,
  onCompLevelChange,
  onAdvancementChange,
}: CommissionSectionProps) => {
  const baseCommission = revenue * (compLevelPercent / 100);

  return (
    <div className="pt-2 border-t">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
        <BadgeDollarSign className="h-4 w-4" />
        Commission Calculation
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="compLevel">Comp Level %</Label>
          <Select
            value={compLevelPercent.toString()}
            onValueChange={(v) => onCompLevelChange(parseFloat(v))}
          >
            <SelectTrigger id="compLevel">
              <SelectValue placeholder="Select level" />
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
            onValueChange={(v) => onAdvancementChange(parseFloat(v))}
          >
            <SelectTrigger id="advancement">
              <SelectValue placeholder="Select %" />
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

      {revenue > 0 && (
        <div className="mt-3 space-y-3">
          {/* Advancement Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Issue Pay ({advancementPercent}%)</span>
              <span>Deferred ({100 - advancementPercent}%)</span>
            </div>
            <Progress value={advancementPercent} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Issue Pay Card */}
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-1 text-xs text-green-700 mb-1">
                <TrendingUp className="h-3 w-3" />
                Issue Pay (Now)
              </div>
              <span className="text-xl font-bold text-green-600">
                ${expectedIssuePay.toFixed(2)}
              </span>
            </div>
            
            {/* Deferred Pay Card */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-1 text-xs text-blue-700 mb-1">
                <Clock className="h-3 w-3" />
                Deferred (9 mo)
              </div>
              <span className="text-xl font-bold text-blue-600">
                ${expectedDeferredPay.toFixed(2)}
              </span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Base: ${revenue.toFixed(2)} × {compLevelPercent}% = ${baseCommission.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
};
