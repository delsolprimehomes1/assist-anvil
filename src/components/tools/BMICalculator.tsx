import { useState } from "react";
import { Calculator } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const BMICalculator = () => {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState<number | null>(null);

  const calculateBMI = () => {
    const heightInches = parseFloat(height);
    const weightLbs = parseFloat(weight);
    
    if (heightInches && weightLbs) {
      const bmiValue = (weightLbs / (heightInches * heightInches)) * 703;
      setBmi(Math.round(bmiValue * 10) / 10);
    }
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Underweight", color: "bg-blue-100 text-blue-800" };
    if (bmi < 25) return { category: "Normal", color: "bg-green-100 text-green-800" };
    if (bmi < 30) return { category: "Overweight", color: "bg-yellow-100 text-yellow-800" };
    return { category: "Obese", color: "bg-red-100 text-red-800" };
  };

  return (
    <Card className="stat-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          BMI Calculator
        </CardTitle>
        <CardDescription>
          Calculate Body Mass Index for health assessments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="height">Height (inches)</Label>
            <Input
              id="height"
              type="number"
              placeholder="70"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (lbs)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="150"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={calculateBMI} className="w-full">
          Calculate BMI
        </Button>

        {bmi && (
          <div className="p-4 bg-accent/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">BMI: {bmi}</span>
              <Badge className={getBMICategory(bmi).color}>
                {getBMICategory(bmi).category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Use this for underwriting health assessments
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};