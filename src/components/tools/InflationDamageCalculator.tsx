import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { GlassCard } from "./shared/GlassCard";
import { InsightBox } from "./shared/InsightBox";
import { AnimatedCounter } from "./shared/AnimatedCounter";
import { CalculatorCTA } from "./shared/CalculatorCTA";
import { calculateInflationDamage, getInflationDamageInsight } from "@/lib/calculatorUtils";
import { TrendingDown, DollarSign, AlertTriangle, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const InflationDamageCalculator = () => {
  const [currentAge, setCurrentAge] = useState(35);
  const [annualIncome, setAnnualIncome] = useState(75000);
  const [inflationRate, setInflationRate] = useState(3);
  const [retirementAge, setRetirementAge] = useState(67);
  const [lifeExpectancy, setLifeExpectancy] = useState(85);
  const [replacementPercent, setReplacementPercent] = useState(80);

  const result = calculateInflationDamage(
    currentAge,
    annualIncome,
    inflationRate,
    retirementAge,
    lifeExpectancy,
    replacementPercent
  );

  const insight = getInflationDamageInsight(result);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-6">
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="h-5 w-5 text-rose-500" />
              <h3 className="font-semibold text-lg">Your Retirement Timeline</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentAge">Current Age</Label>
                <Input
                  id="currentAge"
                  type="number"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(Number(e.target.value))}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retirementAge">Retirement Age</Label>
                <Input
                  id="retirementAge"
                  type="number"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(Number(e.target.value))}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lifeExpectancy">Life Expectancy</Label>
                <Input
                  id="lifeExpectancy"
                  type="number"
                  value={lifeExpectancy}
                  onChange={(e) => setLifeExpectancy(Number(e.target.value))}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualIncome">Annual Income</Label>
                <Input
                  id="annualIncome"
                  type="number"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(Number(e.target.value))}
                  className="text-lg"
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg">Assumptions</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="replacementPercent">Income Replacement % (of current income)</Label>
              <Input
                id="replacementPercent"
                type="number"
                value={replacementPercent}
                onChange={(e) => setReplacementPercent(Number(e.target.value))}
                className="text-lg"
              />
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
            <h3 className="text-lg font-semibold mb-6">The Inflation Damage Report</h3>
            
            <div className="space-y-6">
              {/* Required Income at Retirement */}
              <div className="p-4 bg-gradient-to-br from-rose-500/10 to-rose-500/5 rounded-lg border border-rose-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <p className="text-sm text-muted-foreground">Required Income at Retirement</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedCounter value={result.requiredIncomeAtRetirement} format="currency" decimals={0} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  To maintain {replacementPercent}% of lifestyle
                </p>
              </div>

              {/* Inflation Gap */}
              <div className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-lg border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm text-muted-foreground">Inflation-Adjusted Gap</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedCounter value={result.inflationGap} format="currency" decimals={0} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Additional income needed per year
                </p>
              </div>

              {/* Cost of Delay */}
              <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-lg border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <p className="text-sm text-muted-foreground">Cost of Delaying 1 Year</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedCounter value={result.costOfDelayOneYear} format="currency" decimals={0} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lost compounding opportunity
                </p>
              </div>

              {/* Purchasing Power Loss */}
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Purchasing Power Loss</p>
                <p className="text-2xl font-bold text-foreground">
                  <AnimatedCounter value={result.purchasingPowerLoss} format="percent" decimals={1} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Over {result.yearsToRetirement} years
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Purchasing Power Chart */}
          <GlassCard className="p-6">
            <h4 className="text-sm font-semibold mb-4">Purchasing Power Decay</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={result.purchasingPowerData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>

          <InsightBox type="warning">
            {insight}
          </InsightBox>
        </div>
      </div>

      <CalculatorCTA calculatorName="Inflation Damage Engine" />
    </div>
  );
};
