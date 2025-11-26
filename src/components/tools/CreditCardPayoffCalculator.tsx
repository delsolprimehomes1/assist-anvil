import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { GlassCard } from "./shared/GlassCard";
import { AnimatedCounter } from "./shared/AnimatedCounter";
import { InsightBox } from "./shared/InsightBox";
import { CalculatorCTA } from "./shared/CalculatorCTA";
import { PayoffChart } from "./shared/PayoffChart";
import { calculateCreditCardPayoff, getCreditCardInsight, formatCurrency } from "@/lib/calculatorUtils";

export const CreditCardPayoffCalculator = () => {
  const [balance, setBalance] = useState(5000);
  const [apr, setApr] = useState(18.99);
  const [minPaymentPercent, setMinPaymentPercent] = useState(2);
  const [minPaymentFloor, setMinPaymentFloor] = useState(25);
  const [extraPayment, setExtraPayment] = useState(0);

  const minPayment = Math.max(balance * (minPaymentPercent / 100), minPaymentFloor);
  const totalPayment = minPayment + extraPayment;

  const result = calculateCreditCardPayoff(balance, apr, minPaymentPercent, minPaymentFloor, extraPayment);
  const minOnlyResult = calculateCreditCardPayoff(balance, apr, minPaymentPercent, minPaymentFloor, 0);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
          <CreditCard className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium">Credit Card Payoff</span>
        </div>
        <h2 className="text-3xl font-bold">When Will My Credit Card Be Paid Off?</h2>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Credit Card Balance</Label>
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
                min={5}
                max={30}
                step={0.1}
                className="py-4"
              />
              <div className="text-sm text-muted-foreground text-right">{apr.toFixed(2)}%</div>
            </div>

            <div className="space-y-2">
              <Label>Minimum Payment (%)</Label>
              <Slider
                value={[minPaymentPercent]}
                onValueChange={([value]) => setMinPaymentPercent(value)}
                min={1}
                max={5}
                step={0.1}
                className="py-4"
              />
              <div className="text-sm text-muted-foreground text-right">{minPaymentPercent.toFixed(1)}%</div>
            </div>

            <div className="space-y-2">
              <Label>Minimum Payment Floor ($)</Label>
              <Input
                type="number"
                value={minPaymentFloor}
                onChange={(e) => setMinPaymentFloor(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Extra Monthly Payment (Optional)</Label>
              <Input
                type="number"
                value={extraPayment}
                onChange={(e) => setExtraPayment(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">Your Payment</div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(totalPayment)}/month
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Time to Freedom</div>
                <div className="text-5xl font-bold text-primary">
                  <AnimatedCounter value={result.monthsToPayoff} />
                </div>
                <div className="text-lg text-muted-foreground">months</div>
              </div>

              <PayoffChart currentAmount={0} totalAmount={result.monthsToPayoff} label="Progress to Debt-Free" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground mb-1">Total Interest</div>
                <div className="text-lg font-semibold text-red-500">
                  <AnimatedCounter value={result.totalInterest} format="currency" />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground mb-1">Total Paid</div>
                <div className="text-lg font-semibold">
                  <AnimatedCounter value={result.totalPaid} format="currency" />
                </div>
              </div>
            </div>

            {extraPayment > 0 && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="text-sm font-medium mb-2">With Extra Payments:</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Years Saved:</span>
                    <span className="font-semibold text-green-500">
                      {((minOnlyResult.monthsToPayoff - result.monthsToPayoff) / 12).toFixed(1)} years
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest Saved:</span>
                    <span className="font-semibold text-green-500">
                      {formatCurrency(minOnlyResult.totalInterest - result.totalInterest)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      <InsightBox type="warning">
        {getCreditCardInsight(result.monthsToPayoff, result.totalInterest, balance, extraPayment)}
      </InsightBox>

      <CalculatorCTA calculatorName="Credit Card Payoff" ctaText="Get a Debt Plan Built For You" />
    </div>
  );
};
