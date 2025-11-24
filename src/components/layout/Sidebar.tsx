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
  X,
  ShoppingBag,
  Users,
  Newspaper,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { 
    name: "Order Leads", 
    href: "https://lifecoimo.com/", 
    icon: ShoppingBag,
    external: true
  },
  { name: "CRM", href: "https://lead.lifecoinsurancenetwork.com/", icon: Users, external: true },
  { name: "Carriers", href: "/carriers", icon: Building2 },
  { name: "News", href: "/news", icon: Newspaper },
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
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform duration-300 md:relative md:top-0 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b md:hidden">
          <span className="text-lg font-semibold">Menu</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="space-y-1 p-3">
          {navigation.map((item) => {
            if (item.external) {
              return (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all group",
                    "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              );
            }
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all group",
                    isActive 
                      ? "bg-primary/10 text-primary border-l-4 border-l-primary" 
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                    )} />
                    <span className="flex-1">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </>
  );
};
