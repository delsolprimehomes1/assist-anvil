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
                               calculatorName.includes("Inflation") ||
                               calculatorName.includes("Purchasing Power") ||
                               calculatorName.includes("Cash Flow");
  
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