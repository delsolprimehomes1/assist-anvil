import { useState } from "react";
import { motion } from "framer-motion";
import { PiggyBank } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { GlassCard } from "./shared/GlassCard";
import { AnimatedCounter } from "./shared/AnimatedCounter";
import { InsightBox } from "./shared/InsightBox";
import { CalculatorCTA } from "./shared/CalculatorCTA";
import { PayoffChart } from "./shared/PayoffChart";
import { estimateRemainingBalance, getBalanceInsight, formatCurrency } from "@/lib/calculatorUtils";

export const BalanceEstimatorCalculator = () => {
  const [monthlyPayment, setMonthlyPayment] = useState(400);
  const [interestRate, setInterestRate] = useState(5.5);
  const [monthsRemaining, setMonthsRemaining] = useState(48);

  const result = estimateRemainingBalance(monthlyPayment, interestRate, monthsRemaining);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <PiggyBank className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">Balance Estimator</span>
        </div>
        <h2 className="text-3xl font-bold">What's My Actual Loan Balance?</h2>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Monthly Payment</Label>
              <Input
                type="number"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(Number(e.target.value))}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>Interest Rate (%)</Label>
              <Slider
                value={[interestRate]}
                onValueChange={([value]) => setInterestRate(value)}
                min={1}
                max={15}
                step={0.1}
                className="py-4"
              />
              <div className="text-sm text-muted-foreground text-right">{interestRate.toFixed(2)}%</div>
            </div>

            <div className="space-y-2">
              <Label>Months Remaining</Label>
              <Slider
                value={[monthsRemaining]}
                onValueChange={([value]) => setMonthsRemaining(value)}
                min={1}
                max={120}
                step={1}
                className="py-4"
              />
              <div className="text-sm text-muted-foreground text-right">
                {monthsRemaining} months ({(monthsRemaining / 12).toFixed(1)} years)
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">Estimated Remaining Balance</div>
              <div className="text-5xl font-bold text-primary">
                <AnimatedCounter value={result.balance} format="currency" />
              </div>
            </div>

            <PayoffChart 
              currentAmount={result.totalAlreadyPaid} 
              totalAmount={result.balance + result.totalAlreadyPaid}
              label="Loan Progress"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground mb-1">Already Paid</div>
                <div className="text-lg font-semibold text-green-500">
                  <AnimatedCounter value={result.totalAlreadyPaid} format="currency" />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground mb-1">Remaining Interest</div>
                <div className="text-lg font-semibold text-orange-500">
                  <AnimatedCounter value={result.remainingInterest} format="currency" />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="text-sm font-medium mb-2">Total Loan Info</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Loan:</span>
                  <span className="font-semibold">
                    {formatCurrency(result.balance + result.totalAlreadyPaid)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Still Owe:</span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(result.balance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Progress:</span>
                  <span className="font-semibold text-green-500">
                    {((result.totalAlreadyPaid / (result.balance + result.totalAlreadyPaid)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <InsightBox type="tip">
        {getBalanceInsight(result.balance, monthsRemaining)}
      </InsightBox>

      <CalculatorCTA calculatorName="Balance Estimator" ctaText="Get a Debt Plan Built For You" />
    </div>
  );
};
