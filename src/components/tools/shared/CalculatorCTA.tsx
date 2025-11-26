import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface CalculatorCTAProps {
  calculatorName: string;
  ctaText?: string;
}

export const CalculatorCTA = ({ calculatorName, ctaText = "Talk to an Expert About This" }: CalculatorCTAProps) => {
  const isDebtCalculator = calculatorName.includes("Payoff") || 
                           calculatorName.includes("Debt") || 
                           calculatorName.includes("Balance") ||
                           calculatorName.includes("Loan");
  
  const isCashFlowCalculator = calculatorName.includes("Investing") ||
                               calculatorName.includes("Purchasing Power") ||
                               calculatorName.includes("Cash Flow");
  
  const isRetirementCalculator = calculatorName.includes("Social Security") ||
                                 calculatorName.includes("Inflation Damage") ||
                                 calculatorName.includes("Habits") ||
                                 calculatorName.includes("Retirement");
  
  // Determine CTA text and subtext based on calculator type
  let finalCtaText = ctaText;
  let subText = "Get clarity in 10 minutes. Zero pressure. All data.";
  
  if (isDebtCalculator) {
    if (ctaText === "Talk to an Expert About This") {
      finalCtaText = "Get a Debt Plan Built For You";
    }
    subText = "Real help. Real clarity. Zero pressure.";
  } else if (isCashFlowCalculator) {
    if (ctaText === "Talk to an Expert About This") {
      finalCtaText = "Build My Financial Plan";
    }
    subText = "10 minutes. Zero pressure. Real insight.";
  } else if (isRetirementCalculator) {
    if (ctaText === "Talk to an Expert About This") {
      finalCtaText = "Build My Retirement Strategy";
    }
    subText = "Clarity first. Pressure never.";
  }

  return (
    <div className="mt-6 p-6 bg-gradient-to-br from-primary/5 to-accent-gold/5 rounded-lg border border-primary/10 text-center space-y-3">
      <Button size="lg" className="w-full sm:w-auto">
        <MessageSquare className="mr-2 h-4 w-4" />
        {finalCtaText}
      </Button>
      <p className="text-sm text-muted-foreground">
        {subText}
      </p>
    </div>
  );
};