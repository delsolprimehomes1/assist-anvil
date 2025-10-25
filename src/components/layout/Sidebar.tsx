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
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden animate-fade-in duration-200"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 transform bg-white border-r md:relative md:top-0 md:z-0",
          "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isOpen 
            ? "translate-x-0 scale-100 opacity-100" 
            : "-translate-x-full scale-95 opacity-0",
          "md:translate-x-0 md:scale-100 md:opacity-100"
        )}
      >
        <div className="flex items-center justify-between p-4 md:hidden">
          <span className="text-lg font-semibold">Navigation</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="space-y-1 p-4">
          {navigation.map((item, index) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              style={{ animationDelay: `${index * 50}ms` }}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-smooth group",
                  isOpen && "animate-fade-in",
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