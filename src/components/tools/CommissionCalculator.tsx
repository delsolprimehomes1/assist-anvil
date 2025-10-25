import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Calendar, Percent, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CalculationResult {
  totalCommission: number;
  advanceAmount: number;
  residualAmount: number;
  perPolicy: {
    commission: number;
    advance: number;
    residual: number;
  };
  monthly: number;
  annually: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const CommissionCalculator = () => {
  const [premium, setPremium] = useState("");
  const [contract, setContract] = useState("");
  const [policies, setPolicies] = useState("");
  const [advancePercent, setAdvancePercent] = useState("75");
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Real-time calculation
  useEffect(() => {
    const avgPremium = parseFloat(premium);
    const contractPercent = parseFloat(contract);
    const policyCount = parseFloat(policies);
    const advance = parseFloat(advancePercent);
    
    if (avgPremium && contractPercent && policyCount && advance) {
      const totalCommission = (avgPremium * contractPercent / 100) * policyCount;
      const advanceAmount = totalCommission * (advance / 100);
      const residualAmount = totalCommission - advanceAmount;
      
      setResult({
        totalCommission,
        advanceAmount,
        residualAmount,
        perPolicy: {
          commission: avgPremium * contractPercent / 100,
          advance: (avgPremium * contractPercent / 100) * (advance / 100),
          residual: (avgPremium * contractPercent / 100) * ((100 - advance) / 100)
        },
        monthly: totalCommission,
        annually: totalCommission * 12
      });
    } else {
      setResult(null);
    }
  }, [premium, contract, policies, advancePercent]);

  return (
    <Card className="stat-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Advanced Commission Calculator
        </CardTitle>
        <CardDescription>
          Calculate commission earnings with advance breakdown
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="premium">Average Premium ($)</Label>
            <Input
              id="premium"
              type="number"
              placeholder="2400"
              value={premium}
              onChange={(e) => setPremium(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contract">Contract % (First Year)</Label>
            <Select value={contract} onValueChange={setContract}>
              <SelectTrigger>
                <SelectValue placeholder="Select percentage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="60">60%</SelectItem>
                <SelectItem value="70">70%</SelectItem>
                <SelectItem value="80">80%</SelectItem>
                <SelectItem value="90">90%</SelectItem>
                <SelectItem value="100">100%</SelectItem>
                <SelectItem value="110">110%</SelectItem>
                <SelectItem value="120">120%</SelectItem>
                <SelectItem value="130">130%</SelectItem>
                <SelectItem value="140">140%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="policies">Policies Per Month</Label>
            <Input
              id="policies"
              type="number"
              placeholder="10"
              value={policies}
              onChange={(e) => setPolicies(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="advance" className="flex items-center gap-2">
              Advance Percentage
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Percentage of commission received upfront. Remainder paid at month 12.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Select value={advancePercent} onValueChange={setAdvancePercent}>
              <SelectTrigger>
                <SelectValue placeholder="Select advance %" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="60">60%</SelectItem>
                <SelectItem value="70">70%</SelectItem>
                <SelectItem value="75">75%</SelectItem>
                <SelectItem value="80">80%</SelectItem>
                <SelectItem value="90">90%</SelectItem>
                <SelectItem value="100">100%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {result && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <Separator />

            {/* Immediate Advance Section */}
            <motion.div variants={cardVariants} className="p-6 bg-gradient-primary text-white rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm font-medium opacity-90">Advance Payment (Now)</span>
                </div>
                <Badge className="bg-white/20 text-white border-white/30">
                  {advancePercent}%
                </Badge>
              </div>
              <div className="text-4xl font-bold">${result.advanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="text-sm opacity-90">Received immediately upon sale</div>
            </motion.div>

            {/* Residual Payment Section */}
            {result.residualAmount > 0 && (
              <motion.div variants={cardVariants} className="p-6 bg-secondary rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Residual Payment (Month 12)</span>
                  </div>
                  <Badge variant="outline">
                    {100 - parseFloat(advancePercent)}%
                  </Badge>
                </div>
                <div className="text-3xl font-bold">${result.residualAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="text-sm text-muted-foreground">Paid after policy anniversary</div>
              </motion.div>
            )}

            {/* Progress Visualization */}
            <motion.div variants={cardVariants} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Commission Split</span>
                <span className="font-medium">{advancePercent}% / {100 - parseFloat(advancePercent)}%</span>
              </div>
              <Progress value={parseFloat(advancePercent)} className="h-3" />
            </motion.div>

            {/* Summary Grid */}
            <motion.div variants={cardVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-card border rounded-lg space-y-1">
                <div className="text-sm text-muted-foreground">Monthly Total</div>
                <div className="text-2xl font-bold">${result.monthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>

              <div className="p-4 bg-card border rounded-lg space-y-1">
                <div className="text-sm text-muted-foreground">Annual Projection</div>
                <div className="text-2xl font-bold">${result.annually.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </motion.div>

            {/* Per Policy Breakdown */}
            <motion.div variants={cardVariants} className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Percent className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Per Policy Breakdown</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Commission</div>
                  <div className="text-lg font-semibold">${result.perPolicy.commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Advance</div>
                  <div className="text-lg font-semibold">${result.perPolicy.advance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Residual</div>
                  <div className="text-lg font-semibold">${result.perPolicy.residual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};