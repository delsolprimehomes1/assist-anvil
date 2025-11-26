import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { GlassCard } from "./shared/GlassCard";
import { InsightBox } from "./shared/InsightBox";
import { AnimatedCounter } from "./shared/AnimatedCounter";
import { CalculatorCTA } from "./shared/CalculatorCTA";
import { calculateSocialSecurity, getSocialSecurityInsight } from "@/lib/calculatorUtils";
import { Users, DollarSign, Calendar, TrendingUp } from "lucide-react";

export const SocialSecurityCalculator = () => {
  const [yourIncome, setYourIncome] = useState(75000);
  const [yourAge, setYourAge] = useState(35);
  const [yourRetirementAge, setYourRetirementAge] = useState(67);
  const [spouseIncome, setSpouseIncome] = useState(50000);
  const [spouseAge, setSpouseAge] = useState(33);
  const [spouseRetirementAge, setSpouseRetirementAge] = useState(67);
  const [inflationRate, setInflationRate] = useState(3);

  const result = calculateSocialSecurity(
    yourIncome,
    yourAge,
    yourRetirementAge,
    spouseIncome,
    spouseAge,
    spouseRetirementAge,
    inflationRate
  );

  const insight = getSocialSecurityInsight(result);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-6">
          {/* Your Info */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Your Information</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="yourIncome">Annual Income</Label>
              <Input
                id="yourIncome"
                type="number"
                value={yourIncome}
                onChange={(e) => setYourIncome(Number(e.target.value))}
                className="text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yourAge">Current Age</Label>
                <Input
                  id="yourAge"
                  type="number"
                  value={yourAge}
                  onChange={(e) => setYourAge(Number(e.target.value))}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yourRetirementAge">Retirement Age</Label>
                <Input
                  id="yourRetirementAge"
                  type="number"
                  value={yourRetirementAge}
                  onChange={(e) => setYourRetirementAge(Number(e.target.value))}
                  className="text-lg"
                />
              </div>
            </div>
          </GlassCard>

          {/* Spouse Info */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-accent-gold" />
              <h3 className="font-semibold text-lg">Spouse Information</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="spouseIncome">Annual Income</Label>
              <Input
                id="spouseIncome"
                type="number"
                value={spouseIncome}
                onChange={(e) => setSpouseIncome(Number(e.target.value))}
                className="text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spouseAge">Current Age</Label>
                <Input
                  id="spouseAge"
                  type="number"
                  value={spouseAge}
                  onChange={(e) => setSpouseAge(Number(e.target.value))}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spouseRetirementAge">Retirement Age</Label>
                <Input
                  id="spouseRetirementAge"
                  type="number"
                  value={spouseRetirementAge}
                  onChange={(e) => setSpouseRetirementAge(Number(e.target.value))}
                  className="text-lg"
                />
              </div>
            </div>
          </GlassCard>

          {/* Assumptions */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg">Assumptions</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inflationRate">Inflation Rate (%)</Label>
              <Input
                id="inflationRate"
                type="number"
                step="0.1"
                value={inflationRate}
                onChange={(e) => setInflationRate(Number(e.target.value))}
                className="text-lg"
              />
            </div>
          </GlassCard>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-6">Projected Social Security Benefits</h3>
            
            <div className="space-y-6">
              {/* Your Benefit */}
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Your Monthly Benefit</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedCounter value={result.yourBenefit} format="currency" decimals={0} />
                </p>
              </div>

              {/* Spouse Benefit */}
              <div className="p-4 bg-gradient-to-br from-accent-gold/10 to-accent-gold/5 rounded-lg border border-accent-gold/20">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-accent-gold" />
                  <p className="text-sm text-muted-foreground">Spouse Monthly Benefit</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedCounter value={result.spouseBenefit} format="currency" decimals={0} />
                </p>
              </div>

              {/* Combined Benefit */}
              <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-lg border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm text-muted-foreground">Combined Monthly Benefit</p>
                </div>
                <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                  <AnimatedCounter value={result.combinedBenefit} format="currency" decimals={0} />
                </p>
              </div>

              {/* Inflation-Adjusted Value */}
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Inflation-Adjusted Value</p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  <AnimatedCounter value={result.inflationAdjustedValue} format="currency" decimals={0} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  In today's dollars
                </p>
              </div>

              {/* Income Replacement */}
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Income Replacement</p>
                <p className="text-2xl font-bold text-foreground">
                  <AnimatedCounter value={result.replacementPercentage} format="percent" decimals={1} />
                </p>
              </div>
            </div>
          </GlassCard>

          <InsightBox type="warning">
            {insight}
          </InsightBox>
        </div>
      </div>

      <CalculatorCTA calculatorName="Social Security Estimator" />
    </div>
  );
};
