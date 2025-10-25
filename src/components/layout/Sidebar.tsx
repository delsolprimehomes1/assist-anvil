import { NavLink } from "react-router-dom";
import { 
  BarChart3, 
  Building2, 
  Calculator, 
  GraduationCap, 
  Megaphone, 
  Shield, 
  Bot,
  Settings,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Carriers", href: "/carriers", icon: Building2 },
  { name: "Tools", href: "/tools", icon: Calculator },
  { name: "Training", href: "/training", icon: GraduationCap },
  { name: "Marketing", href: "/marketing", icon: Megaphone },
  { name: "Compliance", href: "/compliance", icon: Shield },
  { name: "AI Assist", href: "/ai-assist", icon: Bot },
  { name: "Admin", href: "/admin", icon: Settings },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden animate-fade-in duration-300
                     bg-gradient-to-b from-black/40 via-black/25 to-black/10 
                     backdrop-blur-lg"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 z-50 w-full bg-white md:relative md:top-0 md:z-0 md:w-64 md:h-[calc(100vh-4rem)] md:border-r",
          "transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isOpen 
            ? "top-16 opacity-100 scale-100" 
            : "-top-full opacity-0 scale-y-95",
          "md:translate-y-0 md:opacity-100 md:scale-100"
        )}
      >
        <div className="flex items-center justify-between p-6 md:hidden border-b bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-primary rounded-full animate-pulse-glow" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Navigation
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="hover:rotate-90 transition-transform duration-300"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="space-y-1 p-4">
          {navigation.map((item, index) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              style={{ 
                animationDelay: `${index * 80}ms`,
                animationFillMode: 'backwards'
              }}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-smooth group",
                  isOpen && "animate-slide-up",
                  isActive
                    ? "bg-gradient-primary text-white shadow-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )
              }
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};