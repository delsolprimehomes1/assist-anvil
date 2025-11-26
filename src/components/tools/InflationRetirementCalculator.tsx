import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingDown, AlertTriangle } from "lucide-react";
import { GlassCard } from "./shared/GlassCard";
import { InsightBox } from "./shared/InsightBox";
import { CalculatorCTA } from "./shared/CalculatorCTA";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { AnimatedCounter } from "./shared/AnimatedCounter";
import { TimelineBar } from "./shared/TimelineBar";
import { calculateInflationRetirement, getInflationRetirementInsight, formatCurrency } from "@/lib/calculatorUtils";

export const InflationRetirementCalculator = () => {
  const [currentAge, setCurrentAge] = useState(35);
  const [grossIncome, setGrossIncome] = useState(75000);
  const [retirementAge, setRetirementAge] = useState(65);
  const [lifeExpectancy, setLifeExpectancy] = useState(85);
  const [replacementPercent, setReplacementPercent] = useState(80);
  const [inflationRate, setInflationRate] = useState(3);

  const result = calculateInflationRetirement(
    currentAge,
    grossIncome,
    retirementAge,
    lifeExpectancy,
    replacementPercent,
    inflationRate
  );

  const insight = getInflationRetirementInsight(result.inflationGap, result.yearsToRetirement);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Panel */}
        <GlassCard className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/10">
              <TrendingDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold">Retirement Inputs</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="currentAge">Current Age</Label>
                <span className="text-sm font-semibold">{currentAge}</span>
              </div>
              <Slider
                id="currentAge"
                value={[currentAge]}
                onValueChange={(v) => setCurrentAge(v[0])}
                min={18}
                max={80}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grossIncome">Current Gross Income ($)</Label>
              <Input
                id="grossIncome"
                type="number"
                value={grossIncome}
                onChange={(e) => setGrossIncome(Number(e.target.value))}
                step="5000"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="retirementAge">Desired Retirement Age</Label>
                <span className="text-sm font-semibold">{retirementAge}</span>
              </div>
              <Slider
                id="retirementAge"
                value={[retirementAge]}
                onValueChange={(v) => setRetirementAge(v[0])}
                min={currentAge + 1}
                max={85}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="lifeExpectancy">Life Expectancy</Label>
                <span className="text-sm font-semibold">{lifeExpectancy}</span>
              </div>
              <Slider
                id="lifeExpectancy"
                value={[lifeExpectancy]}
                onValueChange={(v) => setLifeExpectancy(v[0])}
                min={retirementAge + 1}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="replacementPercent">Income Replacement %</Label>
                <span className="text-sm font-semibold">{replacementPercent}%</span>
              </div>
              <Slider
                id="replacementPercent"
                value={[replacementPercent]}
                onValueChange={(v) => setReplacementPercent(v[0])}
                min={50}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="inflationRate">Inflation Estimate %</Label>
                <span className="text-sm font-semibold">{inflationRate}%</span>
              </div>
              <Slider
                id="inflationRate"
                value={[inflationRate]}
                onValueChange={(v) => setInflationRate(v[0])}
                min={1}
                max={6}
                step={0.5}
              />
            </div>
          </div>
        </GlassCard>

        {/* Results Panel */}
        <div className="space-y-4">
          <GlassCard className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">Required Income at Retirement</div>
              <motion.div
                key={result.requiredIncomeAtRetirement}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold"
              >
                <AnimatedCounter value={result.requiredIncomeAtRetirement} format="currency" decimals={0} />
              </motion.div>
              <p className="text-xs text-muted-foreground">per year, adjusted for inflation</p>
            </div>

            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground text-center">
                {result.yearsToRetirement} years until retirement
              </p>
            </div>
          </GlassCard>

          <div className="grid grid-cols-2 gap-4">
            <GlassCard className="text-center space-y-2">
              <div className="text-xs text-muted-foreground">Total Needed</div>
              <div className="text-lg font-bold">
                <AnimatedCounter value={result.totalRetirementNeeded} format="currency" decimals={0} />
              </div>
            </GlassCard>

            <GlassCard className="text-center space-y-2">
              <div className="text-xs text-muted-foreground">Inflation Gap</div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                <AnimatedCounter value={result.inflationGap} format="currency" decimals={0} />
              </div>
            </GlassCard>
          </div>

          <GlassCard className="bg-gradient-to-br from-rose-500/10 to-amber-500/5 border-rose-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-sm">Cost of Waiting One Year</div>
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(result.costOfWaitingOneYear)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Additional capital needed if you delay retirement planning
                </p>
              </div>
            </div>
          </GlassCard>

          <InsightBox type="warning">
            {insight}
          </InsightBox>
        </div>
      </div>

      <CalculatorCTA calculatorName="Inflation Retirement" />
    </div>
  );
};
