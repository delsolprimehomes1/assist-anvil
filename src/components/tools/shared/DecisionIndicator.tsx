import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DecisionIndicatorProps {
  title: string;
  isRecommended: boolean;
  children?: ReactNode;
  className?: string;
}

export const DecisionIndicator = ({ 
  title, 
  isRecommended, 
  children,
  className 
}: DecisionIndicatorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-lg border p-4 transition-all",
        isRecommended
          ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/30"
          : "bg-gradient-to-br from-muted/50 to-muted/20 border-border/50 opacity-60",
        className
      )}
    >
      {isRecommended && (
        <div className="absolute -top-2 -right-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="bg-emerald-500 rounded-full p-1"
          >
            <Check className="h-4 w-4 text-white" />
          </motion.div>
        </div>
      )}

      {!isRecommended && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-muted rounded-full p-1">
            <X className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className={cn(
          "font-semibold text-lg",
          isRecommended && "text-emerald-600 dark:text-emerald-400"
        )}>
          {title}
        </h4>
        {children}
      </div>
    </motion.div>
  );
};
