import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingDown } from "lucide-react";
import { GlassCard } from "./shared/GlassCard";
import { InsightBox } from "./shared/InsightBox";
import { CalculatorCTA } from "./shared/CalculatorCTA";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { AnimatedCounter } from "./shared/AnimatedCounter";
import { calculatePurchasingPower, getPurchasingPowerInsight, formatCurrency, formatPercent } from "@/lib/calculatorUtils";

export const PurchasingPowerCalculator = () => {
  const [amount, setAmount] = useState(100);
  const [startYear, setStartYear] = useState(2000);
  const [endYear, setEndYear] = useState(2024);

  const result = calculatePurchasingPower(amount, startYear, endYear);
  const insight = getPurchasingPowerInsight(result.lossPercent, endYear - startYear);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Panel */}
        <GlassCard className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500/20 to-pink-500/10">
              <DollarSign className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold">Historical Comparison</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Starting Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                step="10"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="startYear">Start Year</Label>
                <span className="text-sm font-semibold">{startYear}</span>
              </div>
              <Slider
                id="startYear"
                value={[startYear]}
                onValueChange={(v) => setStartYear(v[0])}
                min={1950}
                max={2024}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="endYear">End Year</Label>
                <span className="text-sm font-semibold">{endYear}</span>
              </div>
              <Slider
                id="endYear"
                value={[endYear]}
                onValueChange={(v) => setEndYear(v[0])}
                min={startYear + 1}
                max={2024}
                step={1}
              />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-accent-gold/5 border border-primary/10">
            <div className="text-sm text-muted-foreground mb-2">Time Span</div>
            <div className="text-2xl font-bold">{endYear - startYear} years</div>
          </div>
        </GlassCard>

        {/* Results Panel */}
        <div className="space-y-4">
          <GlassCard className="text-center space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">What {formatCurrency(amount)} in {startYear} equals today</div>
              <motion.div
                key={result.adjustedValue}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl font-bold"
              >
                <AnimatedCounter value={result.adjustedValue} format="currency" decimals={2} />
              </motion.div>
            </div>

            <div className="h-3 bg-background rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(result.adjustedValue / amount) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
              />
            </div>

            <div className="flex items-center justify-center gap-2 text-sm">
              <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span className="text-muted-foreground">
                Purchasing power decreased by <span className="font-bold text-rose-600 dark:text-rose-400">{formatPercent(result.lossPercent)}</span>
              </span>
            </div>
          </GlassCard>

          <div className="grid grid-cols-2 gap-4">
            <GlassCard className="text-center space-y-2">
              <div className="text-xs text-muted-foreground">Dollar Loss</div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                <AnimatedCounter value={result.purchasingPowerLoss} format="currency" decimals={2} />
              </div>
            </GlassCard>

            <GlassCard className="text-center space-y-2">
              <div className="text-xs text-muted-foreground">Inflation Multiple</div>
              <div className="text-2xl font-bold">
                <AnimatedCounter value={result.inflationMultiple} decimals={2} />x
              </div>
            </GlassCard>
          </div>

          <GlassCard className="space-y-3">
            <div className="font-semibold text-sm">Reality Check</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">A gallon of milk in {startYear}</span>
                <span className="font-semibold">≈ ${(2.5 / result.inflationMultiple).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">A gallon of milk today</span>
                <span className="font-semibold">≈ $2.50</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average home in {startYear}</span>
                <span className="font-semibold">≈ ${(400000 / result.inflationMultiple).toFixed(0)}</span>
              </div>
            </div>
          </GlassCard>

          <InsightBox type="warning">
            {insight}
          </InsightBox>
        </div>
      </div>

      <CalculatorCTA calculatorName="Purchasing Power" />
    </div>
  );
};
