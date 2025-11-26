import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface CalculatorCTAProps {
  calculatorName: string;
}

export const CalculatorCTA = ({ calculatorName }: CalculatorCTAProps) => {
  return (
    <div className="mt-6 p-6 bg-gradient-to-br from-primary/5 to-accent-gold/5 rounded-lg border border-primary/10 text-center space-y-3">
      <Button size="lg" className="w-full sm:w-auto">
        <MessageSquare className="mr-2 h-4 w-4" />
        Talk to an Expert About This
      </Button>
      <p className="text-sm text-muted-foreground">
        Get clarity in 10 minutes. Zero pressure. All data.
      </p>
    </div>
  );
};