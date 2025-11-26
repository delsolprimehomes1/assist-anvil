import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { GlassCard } from "./shared/GlassCard";
import { AnimatedCounter } from "./shared/AnimatedCounter";
import { InsightBox } from "./shared/InsightBox";
import { CalculatorCTA } from "./shared/CalculatorCTA";
import { calculateLoanPayment, getLoanPaymentInsight, formatCurrency } from "@/lib/calculatorUtils";

export const LoanPaymentCalculator = () => {
  const [loanAmount, setLoanAmount] = useState(30000);
  const [interestRate, setInterestRate] = useState(5.5);
  const [termMonths, setTermMonths] = useState(60);

  const result = calculateLoanPayment(loanAmount, interestRate, termMonths);
  
  // Calculate comparisons for different terms
  const shortTerm = calculateLoanPayment(loanAmount, interestRate, 36);
  const longTerm = calculateLoanPayment(loanAmount, interestRate, 84);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <Calculator className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">Loan Payment Estimator</span>
        </div>
        <h2 className="text-3xl font-bold">What Will My Loan Payment Be?</h2>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Loan Amount</Label>
              <Input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
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
              <Label>Loan Term (months)</Label>
              <Slider
                value={[termMonths]}
                onValueChange={([value]) => setTermMonths(value)}
                min={12}
                max={96}
                step={6}
                className="py-4"
              />
              <div className="text-sm text-muted-foreground text-right">
                {termMonths} months ({(termMonths / 12).toFixed(1)} years)
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">Monthly Payment</div>
              <div className="text-5xl font-bold text-primary">
                <AnimatedCounter value={result.monthlyPayment} format="currency" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground mb-1">Total Cost</div>
                <div className="text-lg font-semibold">
                  <AnimatedCounter value={result.totalCost} format="currency" />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground mb-1">Total Interest</div>
                <div className="text-lg font-semibold text-orange-500">
                  <AnimatedCounter value={result.totalInterest} format="currency" />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <div className="text-sm font-medium mb-2">Term Comparison</div>
              
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">36 months</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatCurrency(shortTerm.monthlyPayment)}/mo</div>
                    <div className="text-xs text-muted-foreground">Save {formatCurrency(result.totalInterest - shortTerm.totalInterest)}</div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">84 months</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatCurrency(longTerm.monthlyPayment)}/mo</div>
                    <div className="text-xs text-red-500">+{formatCurrency(longTerm.totalInterest - result.totalInterest)} more</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <InsightBox type="warning">
        {getLoanPaymentInsight(result.monthlyPayment, result.totalInterest, termMonths)}
      </InsightBox>

      <CalculatorCTA calculatorName="Loan Payment" ctaText="Get a Debt Plan Built For You" />
    </div>
  );
};
