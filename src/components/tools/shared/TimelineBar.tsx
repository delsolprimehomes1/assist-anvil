import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TimelineBarProps {
  currentAge: number;
  estimatedLifespan: number;
  className?: string;
}

export const TimelineBar = ({ currentAge, estimatedLifespan, className }: TimelineBarProps) => {
  const percentage = (currentAge / estimatedLifespan) * 100;
  const remainingYears = estimatedLifespan - currentAge;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Current Age</span>
        <span className="font-medium">Age {currentAge}</span>
        <span className="text-muted-foreground">Est. Lifespan</span>
      </div>
      
      <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute h-full bg-gradient-to-r from-primary to-accent-gold"
        />
      </div>

      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="font-medium">You are here</span>
        </div>
        <div className="text-right">
          <div className="font-semibold text-primary">{remainingYears} years remaining</div>
          <div className="text-xs text-muted-foreground">Estimated</div>
        </div>
      </div>
    </div>
  );
};