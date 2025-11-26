import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PayoffChartProps {
  currentAmount: number;
  totalAmount: number;
  label?: string;
  className?: string;
}

export const PayoffChart = ({ 
  currentAmount, 
  totalAmount, 
  label = "Progress",
  className 
}: PayoffChartProps) => {
  const percentage = Math.min((currentAmount / totalAmount) * 100, 100);
  
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{percentage.toFixed(1)}%</span>
      </div>
      
      <div className="relative h-4 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute h-full bg-gradient-to-r from-primary to-accent-gold rounded-full"
        />
        
        {/* Milestone markers */}
        {[25, 50, 75].map((milestone) => (
          <div
            key={milestone}
            className="absolute top-0 h-full w-px bg-background/50"
            style={{ left: `${milestone}%` }}
          />
        ))}
      </div>

      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>Start</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>Complete</span>
      </div>
    </div>
  );
};
