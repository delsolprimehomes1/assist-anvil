import { useState } from "react";
import { motion } from "framer-motion";
import { Scale, TrendingUp, TrendingDown } from "lucide-react";
import { GlassCard } from "./shared/GlassCard";
import { InsightBox } from "./shared/InsightBox";
import { CalculatorCTA } from "./shared/CalculatorCTA";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AnimatedCounter } from "./shared/AnimatedCounter";
import { calculateDebtVsInvest, getDebtVsInvestInsight, formatCurrency, formatPercent } from "@/lib/calculatorUtils";

export const DebtVsInvestingCalculator = () => {
  const [debtRate, setDebtRate] = useState(6.5);
  const [isDeductible, setIsDeductible] = useState(false);
  const [investReturn, setInvestReturn] = useState(8);
  const [isTaxable, setIsTaxable] = useState(true);
  const [taxBracket, setTaxBracket] = useState(24);
  const [monthlyFunds, setMonthlyFunds] = useState(500);

  const result = calculateDebtVsInvest(
    debtRate,
    isDeductible,
    investReturn,
    isTaxable,
    taxBracket,
    monthlyFunds
  );

  const insight = getDebtVsInvestInsight(result.recommendation, result.wealthDifference10yr);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Panel */}
        <GlassCard className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/10">
              <Scale className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-lg font-semibold">Decision Inputs</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="debtRate">Interest Rate on Debt (%)</Label>
              <Input
                id="debtRate"
                type="number"
                value={debtRate}
                onChange={(e) => setDebtRate(Number(e.target.value))}
                step="0.1"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isDeductible">Is Interest Tax Deductible?</Label>
              <Switch
                id="isDeductible"
                checked={isDeductible}
                onCheckedChange={setIsDeductible}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investReturn">Expected Investment Return (%)</Label>
              <Input
                id="investReturn"
                type="number"
                value={investReturn}
                onChange={(e) => setInvestReturn(Number(e.target.value))}
                step="0.1"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isTaxable">Is Return Taxable?</Label>
              <Switch
                id="isTaxable"
                checked={isTaxable}
                onCheckedChange={setIsTaxable}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxBracket">Tax Bracket (%)</Label>
              <Input
                id="taxBracket"
                type="number"
                value={taxBracket}
                onChange={(e) => setTaxBracket(Number(e.target.value))}
                step="1"
                max="37"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyFunds">Monthly Funds Available ($)</Label>
              <Input
                id="monthlyFunds"
                type="number"
                value={monthlyFunds}
                onChange={(e) => setMonthlyFunds(Number(e.target.value))}
                step="50"
              />
            </div>
          </div>
        </GlassCard>

        {/* Results Panel */}
        <div className="space-y-4">
          <GlassCard className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20">
              {result.recommendation === "debt" ? (
                <TrendingDown className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              ) : (
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="text-sm font-medium">Best Decision</span>
            </div>

            <motion.div
              key={result.recommendation}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-2"
            >
              <h4 className="text-3xl font-bold">
                {result.recommendation === "debt" ? "Pay Down Debt" : "Invest More"}
              </h4>
              <p className="text-muted-foreground">
                {result.recommendation === "debt"
                  ? "The guaranteed return beats the market risk"
                  : "Your investment potential exceeds debt cost"}
              </p>
            </motion.div>
          </GlassCard>

          <div className="grid grid-cols-2 gap-4">
            <GlassCard className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">Debt Effective Rate</div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                <AnimatedCounter value={result.debtEffectiveRate} decimals={2} format="percent" />
              </div>
            </GlassCard>

            <GlassCard className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">Investment Return</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                <AnimatedCounter value={result.investEffectiveReturn} decimals={2} format="percent" />
              </div>
            </GlassCard>
          </div>

          <GlassCard className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">10-Year Wealth Difference</span>
              <span className="text-2xl font-bold">
                {formatCurrency(Math.abs(result.wealthDifference10yr))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Break-Even Return Needed</span>
              <span className="text-lg font-semibold">{formatPercent(result.breakEvenReturn)}</span>
            </div>
          </GlassCard>

          <InsightBox type={result.recommendation === "debt" ? "warning" : "success"}>
            {insight}
          </InsightBox>
        </div>
      </div>

      <CalculatorCTA calculatorName="Debt vs Investing" />
    </div>
  );
};
