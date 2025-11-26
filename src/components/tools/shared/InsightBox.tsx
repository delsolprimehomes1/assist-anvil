import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Lightbulb, AlertTriangle, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightBoxProps {
  children: ReactNode;
  type?: "info" | "warning" | "success" | "tip";
  className?: string;
}

export const InsightBox = ({ children, type = "info", className }: InsightBoxProps) => {
  const icons = {
    info: Info,
    warning: AlertTriangle,
    success: TrendingUp,
    tip: Lightbulb
  };

  const styles = {
    info: "bg-primary/10 border-primary/20 text-foreground",
    warning: "bg-warning/10 border-warning/30 text-foreground",
    success: "bg-success/10 border-success/20 text-foreground",
    tip: "bg-accent-gold/10 border-accent-gold/20 text-foreground"
  };

  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-lg border p-4 flex items-start gap-3",
        styles[type],
        className
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="text-sm leading-relaxed">{children}</div>
    </motion.div>
  );
};