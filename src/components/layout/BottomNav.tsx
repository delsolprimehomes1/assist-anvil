import { NavLink } from "react-router-dom";
import { 
  BarChart3, 
  Building2, 
  Calculator, 
  Bot,
  ShoppingBag,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Order Leads", href: "https://leads.lifecoimo.com/leads", icon: ShoppingBag, external: true },
  { name: "CRM", href: "https://lead.lifecoinsurancenetwork.com/", icon: Users, external: true },
  { name: "Carriers", href: "/dashboard/carriers", icon: Building2 },
  { name: "Quoting Tools", href: "/dashboard/tools", icon: Calculator },
];

export const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t md:hidden">
      <nav className="flex items-center justify-around py-2">
        {navigation.map((item) => {
          if (item.external) {
            return (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center px-3 py-2 text-xs font-medium transition-smooth text-muted-foreground"
              >
                <div className="relative">
                  <item.icon className="h-5 w-5 mb-1 text-muted-foreground" />
                </div>
                <span>{item.name}</span>
              </a>
            );
          }
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center px-3 py-2 text-xs font-medium transition-all",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon className={cn(
                      "h-5 w-5 mb-1 transition-all",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold" />
                    )}
                  </div>
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};