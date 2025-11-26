import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/calculatorUtils";

interface InterestBreakdownProps {
  principal: number;
  interest: number;
}

export const InterestBreakdown = ({ principal, interest }: InterestBreakdownProps) => {
  const total = principal + interest;
  const principalPercent = (principal / total) * 100;
  const interestPercent = (interest / total) * 100;

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Principal vs Interest</div>
      
      <div className="relative h-8 bg-secondary rounded-lg overflow-hidden flex">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${principalPercent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center"
        >
          {principalPercent > 20 && (
            <span className="text-xs font-medium text-primary-foreground">
              {principalPercent.toFixed(0)}%
            </span>
          )}
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${interestPercent}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center"
        >
          {interestPercent > 20 && (
            <span className="text-xs font-medium text-white">
              {interestPercent.toFixed(0)}%
            </span>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary" />
          <div>
            <div className="text-xs text-muted-foreground">Principal</div>
            <div className="font-semibold">{formatCurrency(principal)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-r from-orange-500 to-red-500" />
          <div>
            <div className="text-xs text-muted-foreground">Interest</div>
            <div className="font-semibold text-orange-500">{formatCurrency(interest)}</div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-border text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total to be paid:</span>
          <span className="font-semibold">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
};
