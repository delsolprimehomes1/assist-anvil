import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarrierLogoProps {
  name: string;
  shortCode: string;
  className?: string;
}

const getGradientByInitial = (initial: string) => {
  const gradients = {
    A: "from-blue-500 to-cyan-500",
    B: "from-purple-500 to-pink-500",
    C: "from-emerald-500 to-teal-500",
    D: "from-orange-500 to-red-500",
    E: "from-yellow-500 to-orange-500",
    F: "from-indigo-500 to-purple-500",
    G: "from-green-500 to-emerald-500",
    H: "from-pink-500 to-rose-500",
    I: "from-cyan-500 to-blue-500",
    J: "from-violet-500 to-purple-500",
    K: "from-lime-500 to-green-500",
    L: "from-amber-500 to-orange-500",
    M: "from-teal-500 to-cyan-500",
    N: "from-rose-500 to-pink-500",
    O: "from-sky-500 to-blue-500",
    P: "from-fuchsia-500 to-purple-500",
    Q: "from-emerald-500 to-green-500",
    R: "from-red-500 to-orange-500",
    S: "from-blue-500 to-indigo-500",
    T: "from-green-500 to-teal-500",
    U: "from-purple-500 to-violet-500",
    V: "from-pink-500 to-fuchsia-500",
    W: "from-cyan-500 to-sky-500",
    X: "from-orange-500 to-amber-500",
    Y: "from-indigo-500 to-blue-500",
    Z: "from-lime-500 to-emerald-500",
  };
  
  const firstLetter = initial.charAt(0).toUpperCase();
  return gradients[firstLetter as keyof typeof gradients] || "from-primary to-secondary";
};

export function CarrierLogo({ name, shortCode, className }: CarrierLogoProps) {
  const gradient = getGradientByInitial(shortCode);
  
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl bg-gradient-to-br overflow-hidden",
        gradient,
        className
      )}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      {/* Logo content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <Building2 className="w-6 h-6 text-white mb-1" />
        <span className="text-xs font-bold text-white tracking-wider">
          {shortCode}
        </span>
      </div>
    </div>
  );
}
