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
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Order Leads", href: "https://lifecoimo.com/", icon: ShoppingBag, badge: 5, external: true },
  { name: "CRM", href: "https://lead.lifecoinsurancenetwork.com/", icon: Users, external: true },
  { name: "Carriers", href: "/carriers", icon: Building2 },
  { name: "Tools", href: "/tools", icon: Calculator },
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
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 bg-destructive text-white text-[8px] font-bold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
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
                  "flex flex-col items-center px-3 py-2 text-xs font-medium transition-smooth",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon className={cn(
                      "h-5 w-5 mb-1",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-2 bg-destructive text-white text-[8px] font-bold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
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