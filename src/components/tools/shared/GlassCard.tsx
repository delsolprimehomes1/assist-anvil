import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const GlassCard = ({ children, className, hover = true }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-4 sm:p-6 transition-all duration-200",
        hover && "hover:shadow-md hover:border-primary/50",
        className
      )}
    >
      {children}
    </div>
  );
};