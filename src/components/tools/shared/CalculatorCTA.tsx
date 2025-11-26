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
  
  const subText = isDebtCalculator 
    ? "Real help. Real clarity. Zero pressure."
    : "Get clarity in 10 minutes. Zero pressure. All data.";

  return (
    <div className="mt-6 p-6 bg-gradient-to-br from-primary/5 to-accent-gold/5 rounded-lg border border-primary/10 text-center space-y-3">
      <Button size="lg" className="w-full sm:w-auto">
        <MessageSquare className="mr-2 h-4 w-4" />
        {ctaText}
      </Button>
      <p className="text-sm text-muted-foreground">
        {subText}
      </p>
    </div>
  );
};