import { useState } from "react";
import { Shield, AlertCircle, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { GlassCard } from "./shared/GlassCard";
import { AnimatedCounter } from "./shared/AnimatedCounter";
import { InsightBox } from "./shared/InsightBox";
import { CalculatorCTA } from "./shared/CalculatorCTA";
import { calculateInsuranceLongevity, getInsuranceInsight, formatCurrency } from "@/lib/calculatorUtils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export const InsuranceLongevityCalculator = () => {
  const [insuranceAmount, setInsuranceAmount] = useState("500000");
  const [monthlyNeeds, setMonthlyNeeds] = useState("4000");
  const [inflationRate, setInflationRate] = useState([3]);
  const [returnRate, setReturnRate] = useState([4]);
  const [taxRate, setTaxRate] = useState([25]);

  const insurance = parseFloat(insuranceAmount) || 0;
  const monthly = parseFloat(monthlyNeeds) || 0;

  const result = insurance > 0 && monthly > 0 
    ? calculateInsuranceLongevity(insurance, monthly, inflationRate[0], returnRate[0], taxRate[0])
    : null;

  // Prepare chart data (show first 30 years or until depletion)
  const chartData = result 
    ? result.monthlyDepletion
        .filter((_, i) => i % 12 === 0) // Show yearly
        .slice(0, 30)
        .map((balance, i) => ({
          year: i + 1,
          balance: Math.round(balance)
        }))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Life Insurance Longevity Calculator
        </CardTitle>
        <CardDescription>
          How long would your life insurance last?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="insurance">Insurance/Benefit Amount ($)</Label>
            <Input
              id="insurance"
              type="number"
              value={insuranceAmount}
              onChange={(e) => setInsuranceAmount(e.target.value)}
              placeholder="500000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly">Monthly Income Needs ($)</Label>
            <Input
              id="monthly"
              type="number"
              value={monthlyNeeds}
              onChange={(e) => setMonthlyNeeds(e.target.value)}
              placeholder="4000"
            />
          </div>

          <div className="space-y-2">
            <Label>Inflation Rate: {inflationRate[0]}%</Label>
            <Slider
              value={inflationRate}
              onValueChange={setInflationRate}
              min={1}
              max={6}
              step={0.5}
              className="mt-2"
            />
          </div>

          <div className="space-y-2">
            <Label>Return on Proceeds: {returnRate[0]}%</Label>
            <Slider
              value={returnRate}
              onValueChange={setReturnRate}
              min={0}
              max={8}
              step={0.5}
              className="mt-2"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Tax Rate: {taxRate[0]}%</Label>
            <Slider
              value={taxRate}
              onValueChange={setTaxRate}
              min={0}
              max={40}
              step={5}
              className="mt-2"
            />
          </div>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <GlassCard className={
              result.shortfall 
                ? "bg-gradient-to-br from-destructive/10 to-warning/10 border-destructive/30"
                : "bg-gradient-to-br from-success/10 to-primary/10"
            }>
              <div className="flex items-center gap-2 mb-4">
                {result.shortfall ? (
                  <AlertCircle className="h-6 w-6 text-destructive" />
                ) : (
                  <Shield className="h-6 w-6 text-success" />
                )}
                <span className="text-sm font-medium text-muted-foreground">
                  Estimated Coverage Duration
                </span>
              </div>
              <div className="text-5xl font-bold mb-2">
                <AnimatedCounter value={result.yearsLasting} format="number" decimals={1} />
                <span className="text-3xl"> years</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {result.shortfall 
                  ? "⚠️ May not last through family's needs"
                  : "✓ Adequate duration for typical needs"
                }
              </p>
            </GlassCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassCard hover={false}>
                <div className="text-sm text-muted-foreground mb-1">After-Tax Proceeds</div>
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={insurance * (1 - taxRate[0] / 100)} format="currency" />
                </div>
              </GlassCard>

              <GlassCard hover={false}>
                <div className="text-sm text-muted-foreground mb-1">Monthly Withdrawal</div>
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={monthly} format="currency" />
                </div>
              </GlassCard>
            </div>

            {chartData.length > 0 && (
              <GlassCard hover={false} className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Balance Depletion Over Time</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="year" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke={result.shortfall ? "hsl(var(--destructive))" : "hsl(var(--success))"} 
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </GlassCard>
            )}

            <InsightBox type="warning">
              {getInsuranceInsight(result.yearsLasting)}
            </InsightBox>

            <InsightBox type="info">
              <strong>Inflation Impact:</strong> At {inflationRate[0]}% inflation, your ${monthly.toLocaleString()}/month need becomes ${(monthly * Math.pow(1 + inflationRate[0] / 100, 10)).toLocaleString(undefined, { maximumFractionDigits: 0 })}/month in just 10 years. Most families don't account for this.
            </InsightBox>

            {result.shortfall && (
              <InsightBox type="warning">
                <strong>Critical Gap Identified:</strong> Your coverage would be depleted before your family's long-term needs are met. This is the most common oversight in life insurance planning.
              </InsightBox>
            )}

            <CalculatorCTA calculatorName="Insurance Longevity" />
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};