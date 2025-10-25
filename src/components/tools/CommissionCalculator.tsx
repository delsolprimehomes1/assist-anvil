import { useState } from "react";
import { DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const CommissionCalculator = () => {
  const [premium, setPremium] = useState("");
  const [contract, setContract] = useState("");
  const [policies, setPolicies] = useState("");
  const [result, setResult] = useState<{ commission: number; monthly: number } | null>(null);

  const calculateCommission = () => {
    const avgPremium = parseFloat(premium);
    const contractPercent = parseFloat(contract);
    const policyCount = parseFloat(policies);
    
    if (avgPremium && contractPercent && policyCount) {
      const commission = (avgPremium * contractPercent / 100) * policyCount;
      const monthly = commission; // Assuming annual premium shown monthly
      setResult({ commission, monthly });
    }
  };

  return (
    <Card className="stat-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Commission Calculator
        </CardTitle>
        <CardDescription>
          Calculate potential commission earnings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="premium">Average Premium ($)</Label>
            <Input
              id="premium"
              type="number"
              placeholder="2400"
              value={premium}
              onChange={(e) => setPremium(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contract">Contract % (First Year)</Label>
            <Select value={contract} onValueChange={setContract}>
              <SelectTrigger>
                <SelectValue placeholder="Select percentage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="60">60%</SelectItem>
                <SelectItem value="70">70%</SelectItem>
                <SelectItem value="80">80%</SelectItem>
                <SelectItem value="90">90%</SelectItem>
                <SelectItem value="100">100%</SelectItem>
                <SelectItem value="110">110%</SelectItem>
                <SelectItem value="120">120%</SelectItem>
                <SelectItem value="130">130%</SelectItem>
                <SelectItem value="140">140%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="policies">Policies Per Month</Label>
            <Input
              id="policies"
              type="number"
              placeholder="10"
              value={policies}
              onChange={(e) => setPolicies(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={calculateCommission} className="w-full">
          Calculate Commission
        </Button>

        {result && (
          <div className="p-4 bg-gradient-primary text-white rounded-lg space-y-2">
            <div className="text-center">
              <div className="text-2xl font-bold">${result.commission.toLocaleString()}</div>
              <div className="text-sm opacity-90">Monthly Commission</div>
            </div>
            <div className="text-center text-sm opacity-90">
              ${(result.commission * 12).toLocaleString()} annually
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};