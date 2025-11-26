import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlassCard } from "./shared/GlassCard";
import { InsightBox } from "./shared/InsightBox";
import { AnimatedCounter } from "./shared/AnimatedCounter";
import { CalculatorCTA } from "./shared/CalculatorCTA";
import { calculateHabitsToWealth, getHabitsWealthInsight } from "@/lib/calculatorUtils";
import { Coffee, TrendingUp, Zap, Target } from "lucide-react";

export const HabitsWealthCalculator = () => {
  const [oneTimeExpense, setOneTimeExpense] = useState(0);
  const [recurringExpense, setRecurringExpense] = useState(5);
  const [frequency, setFrequency] = useState(20); // times per month
  const [yearsToRetirement, setYearsToRetirement] = useState(30);
  const [expectedReturn, setExpectedReturn] = useState(7);
  const [taxBracket, setTaxBracket] = useState(24);

  const result = calculateHabitsToWealth(
    oneTimeExpense,
    recurringExpense,
    frequency,
    yearsToRetirement,
    expectedReturn,
    taxBracket
  );

  const insight = getHabitsWealthInsight(result);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-6">
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Coffee className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-lg">Your Spending Habits</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="oneTimeExpense">One-Time Expense (optional)</Label>
              <Input
                id="oneTimeExpense"
                type="number"
                value={oneTimeExpense}
                onChange={(e) => setOneTimeExpense(Number(e.target.value))}
                className="text-lg"
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Large one-time purchase you're considering
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurringExpense">Recurring Expense ($)</Label>
              <Input
                id="recurringExpense"
                type="number"
                value={recurringExpense}
                onChange={(e) => setRecurringExpense(Number(e.target.value))}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Cost per occurrence (e.g., coffee, lunch out, subscription)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency (times per month)</Label>
              <Input
                id="frequency"
                type="number"
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
                className="text-lg"
              />
            </div>
          </GlassCard>

          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg">Investment Assumptions</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsToRetirement">Years Until Retirement</Label>
              <Input
                id="yearsToRetirement"
                type="number"
                value={yearsToRetirement}
                onChange={(e) => setYearsToRetirement(Number(e.target.value))}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedReturn">Expected Return (%)</Label>
              <Input
                id="expectedReturn"
                type="number"
                step="0.1"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxBracket">Tax Bracket (%)</Label>
              <Input
                id="taxBracket"
                type="number"
                value={taxBracket}
                onChange={(e) => setTaxBracket(Number(e.target.value))}
                className="text-lg"
              />
            </div>
          </GlassCard>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-6">The Real Cost of Your Habits</h3>
            
            <div className="space-y-6">
              {/* Total Opportunity Cost */}
              <div className="p-4 bg-gradient-to-br from-rose-500/10 to-rose-500/5 rounded-lg border border-rose-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <p className="text-sm text-muted-foreground">Total Opportunity Cost</p>
                </div>
                <p className="text-4xl font-bold text-foreground">
                  <AnimatedCounter value={result.totalOpportunityCost} format="currency" decimals={0} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  What you're really giving up
                </p>
              </div>

              {/* Comparison Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Spend Now */}
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-2">If You Spend</p>
                  <p className="text-2xl font-bold text-foreground">
                    <AnimatedCounter value={result.totalSpent} format="currency" decimals={0} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total spent</p>
                </div>

                {/* Invest Instead */}
                <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-lg border border-emerald-500/20">
                  <p className="text-xs text-muted-foreground mb-2">If You Invest</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    <AnimatedCounter value={result.futureValue} format="currency" decimals={0} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Future value</p>
                </div>
              </div>

              {/* Wealth Multiplier */}
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Wealth Multiplier</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedCounter value={result.wealthMultiplier} format="number" decimals={1} />x
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  How much your money grows
                </p>
              </div>

              {/* Monthly Impact */}
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Monthly Spending</p>
                <p className="text-2xl font-bold text-foreground">
                  <AnimatedCounter value={result.monthlySpending} format="currency" decimals={0} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  On this habit alone
                </p>
              </div>
            </div>
          </GlassCard>

          <InsightBox type="tip">
            {insight}
          </InsightBox>

          {/* Real-World Examples */}
          <GlassCard className="p-6">
            <h4 className="text-sm font-semibold mb-4">Real-World Context</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Coffee className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Daily coffee habit:</span> $5/day × 30 years = 
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold"> ~$100,000</span> invested
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Subscription creep:</span> $50/month × 30 years = 
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold"> ~$60,000</span> invested
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <CalculatorCTA calculatorName="Habits to Wealth" />
    </div>
  );
};
