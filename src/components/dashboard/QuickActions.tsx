import { Building2, Calculator, GraduationCap, Megaphone, Shield, Bot } from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  {
    title: "Carriers",
    icon: Building2,
    href: "/carriers",
  },
  {
    title: "Tools",
    icon: Calculator,
    href: "/tools",
  },
  {
    title: "Training",
    icon: GraduationCap,
    href: "/training",
  },
  {
    title: "Marketing",
    icon: Megaphone,
    href: "/marketing",
  },
  {
    title: "Compliance",
    icon: Shield,
    href: "/compliance",
  },
  {
    title: "AI Assist",
    icon: Bot,
    href: "/ai-assist",
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
            <div className="group bg-card border border-border rounded-xl p-6 md:p-8 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 flex flex-col items-center justify-center gap-3 md:gap-4 min-h-[140px] md:min-h-[160px]">
              <action.icon className="h-10 w-10 md:h-12 md:w-12 text-primary transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} />
              <span className="text-sm md:text-base font-semibold text-foreground text-center">
                {action.title}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
