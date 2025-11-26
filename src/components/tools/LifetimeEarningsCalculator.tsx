import { useState } from "react";
import { DollarSign, TrendingUp, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { GlassCard } from "./shared/GlassCard";
import { AnimatedCounter } from "./shared/AnimatedCounter";
import { InsightBox } from "./shared/InsightBox";
import { CalculatorCTA } from "./shared/CalculatorCTA";
import { calculateLifetimeEarnings, getEarningsInsight, formatCurrency } from "@/lib/calculatorUtils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export const LifetimeEarningsCalculator = () => {
  const [currentAge, setCurrentAge] = useState(35);
  const [retirementAge, setRetirementAge] = useState([65]);
  const [currentIncome, setCurrentIncome] = useState("75000");
  const [annualIncrease, setAnnualIncrease] = useState([3]);

  const income = parseFloat(currentIncome) || 0;
  const result = calculateLifetimeEarnings(currentAge, retirementAge[0], income, annualIncrease[0]);

  // Generate chart data
  const chartData = [];
  let projectedIncome = income;
  for (let age = currentAge; age <= retirementAge[0]; age += 5) {
    chartData.push({
      age,
      income: Math.round(projectedIncome)
    });
    projectedIncome *= Math.pow(1 + annualIncrease[0] / 100, 5);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Lifetime Earnings Calculator
        </CardTitle>
        <CardDescription>
          How much will I earn in my lifetime?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currentAge">Current Age</Label>
            <Input
              id="currentAge"
              type="number"
              value={currentAge}
              onChange={(e) => setCurrentAge(parseInt(e.target.value) || 25)}
              min={18}
              max={80}
            />
          </div>

          <div className="space-y-2">
            <Label>Retirement Age: {retirementAge[0]}</Label>
            <Slider
              value={retirementAge}
              onValueChange={setRetirementAge}
              min={55}
              max={75}
              step={1}
              className="mt-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="income">Current Annual Income ($)</Label>
            <Input
              id="income"
              type="number"
              value={currentIncome}
              onChange={(e) => setCurrentIncome(e.target.value)}
              placeholder="75000"
            />
          </div>

          <div className="space-y-2">
            <Label>Expected Annual Increase: {annualIncrease[0]}%</Label>
            <Slider
              value={annualIncrease}
              onValueChange={setAnnualIncrease}
              min={0}
              max={8}
              step={0.5}
              className="mt-2"
            />
          </div>
        </div>

        {income > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <GlassCard className="bg-gradient-to-br from-success/10 to-primary/10">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-6 w-6 text-success" />
                <span className="text-sm font-medium text-muted-foreground">Total Lifetime Earnings</span>
              </div>
              <div className="text-5xl font-bold mb-2">
                <AnimatedCounter value={result.totalEarnings} format="currency" />
              </div>
              <p className="text-sm text-muted-foreground">
                Over the next {result.yearsRemaining} working years
              </p>
            </GlassCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassCard hover={false}>
                <div className="text-sm text-muted-foreground mb-1">Working Years Remaining</div>
                <div className="text-3xl font-bold">
                  <AnimatedCounter value={result.yearsRemaining} format="number" />
                </div>
              </GlassCard>

              <GlassCard hover={false}>
                <div className="text-sm text-muted-foreground mb-1">Income at Retirement</div>
                <div className="text-3xl font-bold text-primary">
                  <AnimatedCounter value={result.incomeAtRetirement} format="currency" />
                </div>
              </GlassCard>
            </div>

            <GlassCard hover={false} className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Income Growth Projection</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="age" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
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
                    dataKey="income" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>

            <InsightBox type="success">
              {getEarningsInsight(result.totalEarnings, result.yearsRemaining)}
            </InsightBox>

            <InsightBox type="tip">
              <strong>Your Most Valuable Asset:</strong> Your earning power isn't your job — it's your ability to generate income. If income stops, everything stops. This is the number worth protecting.
            </InsightBox>

            <CalculatorCTA calculatorName="Lifetime Earnings" />
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};