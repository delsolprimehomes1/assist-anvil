import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  format?: "currency" | "number" | "percent";
  className?: string;
  decimals?: number;
}

export const AnimatedCounter = ({ 
  value, 
  format = "number", 
  className = "",
  decimals = 0
}: AnimatedCounterProps) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (format === "currency") {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(latest);
    } else if (format === "percent") {
      return `${latest.toFixed(decimals)}%`;
    }
    return Math.round(latest).toLocaleString();
  });

  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (format === "currency") {
          setDisplayValue(new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          }).format(latest));
        } else if (format === "percent") {
          setDisplayValue(`${latest.toFixed(decimals)}%`);
        } else {
          setDisplayValue(Math.round(latest).toLocaleString());
        }
      }
    });

    return controls.stop;
  }, [value, format, decimals, count]);

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  );
};