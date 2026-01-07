import { Building2, Calculator, GraduationCap, Megaphone, Shield, Bot } from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  {
    title: "Carriers",
    icon: Building2,
    href: "/dashboard/carriers",
  },
  {
    title: "Quoting Tools",
    icon: Calculator,
    href: "/dashboard/tools",
  },
  {
    title: "Training",
    icon: GraduationCap,
    href: "/dashboard/training",
  },
  {
    title: "Marketing",
    icon: Megaphone,
    href: "/dashboard/marketing",
  },
  {
    title: "Compliance",
    icon: Shield,
    href: "/dashboard/compliance",
  },
  {
    title: "AI Assist",
    icon: Bot,
    href: "/dashboard/ai-assist",
  }
];

export const QuickActions = () => {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {actions.map((action, index) => (
          <Link 
            key={action.title} 
            to={action.href}
            className="block"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="group brand-card p-6 md:p-8 flex flex-col items-center justify-center gap-3 md:gap-4 min-h-[140px] md:min-h-[160px]">
              <div className="rounded-full bg-gradient-to-br from-primary/10 to-gold/10 p-4 group-hover:from-primary/20 group-hover:to-gold/20 transition-all">
                <action.icon className="h-10 w-10 md:h-12 md:w-12 text-primary group-hover:text-gold transition-all duration-200 group-hover:scale-110" strokeWidth={1.5} />
              </div>
              <span className="text-sm md:text-base font-semibold text-foreground text-center group-hover:text-primary transition-colors">
                {action.title}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
