import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { GlassCard } from "./shared/GlassCard";
import { AnimatedCounter } from "./shared/AnimatedCounter";
import { InsightBox } from "./shared/InsightBox";
import { CalculatorCTA } from "./shared/CalculatorCTA";
import { InterestBreakdown } from "./shared/InterestBreakdown";
import { calculateLoanPayoff, getLoanPayoffInsight, formatCurrency } from "@/lib/calculatorUtils";

export const LoanPayoffCalculator = () => {
  const [balance, setBalance] = useState(25000);
  const [apr, setApr] = useState(6.5);
  const [monthlyPayment, setMonthlyPayment] = useState(500);

  const result = calculateLoanPayoff(balance, apr, monthlyPayment);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
          <Calendar className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Loan Payoff Timeline</span>
        </div>
        <h2 className="text-3xl font-bold">How Long Until My Loan Is Paid Off?</h2>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Current Loan Balance</Label>
              <Input
                type="number"
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>APR (%)</Label>
              <Slider
                value={[apr]}
                onValueChange={([value]) => setApr(value)}
                min={1}
                max={15}
                step={0.1}
                className="py-4"
              />
              <div className="text-sm text-muted-foreground text-right">{apr.toFixed(2)}%</div>
            </div>

            <div className="space-y-2">
              <Label>Monthly Payment</Label>
              <Input
                type="number"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(Number(e.target.value))}
                className="text-lg"
              />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Payoff Date</div>
                <div className="text-3xl font-bold text-primary">
                  {result.payoffDate}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">Time Remaining</div>
                <div className="text-5xl font-bold">
                  <AnimatedCounter value={result.monthsRemaining} />
                </div>
                <div className="text-lg text-muted-foreground">months</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground mb-1">Total Interest Cost</div>
                <div className="text-2xl font-semibold text-orange-500">
                  <AnimatedCounter value={result.totalInterest} format="currency" />
                </div>
              </div>

              <InterestBreakdown 
                principal={balance} 
                interest={result.totalInterest}
              />
            </div>
          </div>
        </GlassCard>
      </div>

      <InsightBox type="info">
        {getLoanPayoffInsight(result.totalInterest, balance)}
      </InsightBox>

      <CalculatorCTA calculatorName="Loan Payoff" ctaText="Get a Debt Plan Built For You" />
    </div>
  );
};
