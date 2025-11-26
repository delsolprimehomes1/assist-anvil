import { useState } from "react";
import { Clock, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { GlassCard } from "./shared/GlassCard";
import { AnimatedCounter } from "./shared/AnimatedCounter";
import { InsightBox } from "./shared/InsightBox";
import { CalculatorCTA } from "./shared/CalculatorCTA";
import { TimelineBar } from "./shared/TimelineBar";
import { getLifeExpectancy, getLifeExpectancyInsight } from "@/lib/calculatorUtils";

export const LifeExpectancyCalculator = () => {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState([35]);

  const result = getLifeExpectancy(age[0], gender);
  const remainingYears = result.average - age[0];
  const workingYearsLeft = Math.max(0, 65 - age[0]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Life Expectancy Calculator
        </CardTitle>
        <CardDescription>
          How long am I likely to live?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender} onValueChange={(v) => setGender(v as 'male' | 'female')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Current Age: {age[0]}</Label>
            <Slider
              value={age}
              onValueChange={setAge}
              min={25}
              max={80}
              step={1}
              className="mt-2"
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <GlassCard className="bg-gradient-to-br from-primary/10 to-accent-gold/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Estimated Lifespan</span>
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">
              <AnimatedCounter value={result.min} format="number" /> - <AnimatedCounter value={result.max} format="number" /> years
            </div>
            <p className="text-sm text-muted-foreground">
              Average: <span className="font-semibold text-foreground">{result.average} years</span>
            </p>
          </GlassCard>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassCard hover={false}>
              <div className="text-sm text-muted-foreground mb-1">Remaining Years</div>
              <div className="text-3xl font-bold text-primary">
                <AnimatedCounter value={remainingYears} format="number" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Based on average</p>
            </GlassCard>

            {workingYearsLeft > 0 && (
              <GlassCard hover={false} className="bg-accent-gold/5 border-accent-gold/20">
                <div className="text-sm text-muted-foreground mb-1">Working Years Left</div>
                <div className="text-3xl font-bold">
                  <AnimatedCounter value={workingYearsLeft} format="number" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Until typical retirement (65)</p>
              </GlassCard>
            )}
          </div>

          <TimelineBar currentAge={age[0]} estimatedLifespan={result.average} />

          <InsightBox type="tip">
            {getLifeExpectancyInsight(remainingYears)}
          </InsightBox>

          <InsightBox type="warning">
            <strong>Longevity Risk:</strong> Most people underestimate their lifespan by 10-15 years. Outliving your money is more common than you think. Planning stops being optional the older you get.
          </InsightBox>

          <CalculatorCTA calculatorName="Life Expectancy" />
        </motion.div>
      </CardContent>
    </Card>
  );
};