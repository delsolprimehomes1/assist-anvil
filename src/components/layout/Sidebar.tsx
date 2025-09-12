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
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 transform bg-white border-r transition-transform duration-300 ease-in-out md:relative md:top-0 md:z-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between p-4 md:hidden">
          <span className="text-lg font-semibold">Navigation</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="space-y-1 p-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-smooth group",
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