import { NavLink } from "react-router-dom";
import { 
  BarChart3, 
  Building2, 
  TrendingUp,
  ShoppingBag,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Leads", href: "https://leads.lifecoimo.com/leads", icon: ShoppingBag, external: true },
  { name: "Performance", href: "/dashboard/performance", icon: TrendingUp },
  { name: "Carriers", href: "/dashboard/carriers", icon: Building2 },
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

        {/* BattersBox CRM Subscribe CTA */}
        <a
          href="https://buy.stripe.com/4gM7sK95m9Ha77s7Itgw00q"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center px-2 py-1.5 min-h-[52px] justify-center group"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold/15 border border-gold/40 mb-0.5 transition-all group-active:scale-95 group-hover:bg-gold/25">
            <CreditCard className="h-4 w-4 text-gold" />
          </div>
          <span className="text-[10px] font-semibold text-gold leading-tight text-center">CRM Signup</span>
        </a>
      </nav>
    </div>
  );
};
