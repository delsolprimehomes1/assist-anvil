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
  ExternalLink,
  Network,
  TrendingUp,
  CreditCard,
  FileSearch
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { 
    name: "Order Leads", 
    href: "https://leads.lifecoimo.com/", 
    icon: ShoppingBag,
    external: true
  },
  { name: "CRM", href: "https://app.battersbox.ai", icon: Users, external: true },
  { name: "Carriers", href: "/dashboard/carriers", icon: Building2 },
  { name: "News", href: "/dashboard/news", icon: Newspaper },
  { name: "Quoting Tools", href: "/dashboard/tools", icon: Calculator },
  { name: "Training", href: "/dashboard/training", icon: GraduationCap },
  { name: "Marketing", href: "/dashboard/marketing", icon: Megaphone },
  { name: "Compliance", href: "/dashboard/compliance", icon: Shield },
  
  { name: "Underwriting AI", href: "/dashboard/underwriting", icon: FileSearch },
  { name: "Performance", href: "/dashboard/performance", icon: TrendingUp },
  { name: "Organization", href: "/dashboard/organization", icon: Network },
  { name: "Admin", href: "/dashboard/admin", icon: Settings },
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
          "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform duration-300 md:relative md:top-0 md:translate-x-0 flex flex-col",
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
        
        <nav className="space-y-1 p-3 flex-1 overflow-y-auto">
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

        {/* CRM Subscription CTA */}
        <div className="p-3 border-t">
          <a
            href="https://buy.stripe.com/4gM7sK95m9Ha77s7Itgw00q"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-3 rounded-lg border border-gold/50 bg-gold/10 hover:bg-gold/20 active:scale-[0.98] transition-all group w-full min-h-[52px] shadow-sm hover:shadow-[0_0_12px_hsl(var(--gold)/0.3)]"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center border border-gold/40">
              <CreditCard className="h-4.5 w-4.5 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gold leading-tight">BattersBox CRM</p>
              <p className="text-xs text-gold/70 leading-tight mt-0.5">Subscribe for Access</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-gold/60 group-hover:text-gold transition-colors" />
          </a>
        </div>
      </div>
    </>
  );
};
