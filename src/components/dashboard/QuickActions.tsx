import { Building2, Calculator, GraduationCap, Megaphone, Shield, Bot } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const actions = [
  {
    title: "Carriers",
    description: "Browse insurance carriers and portals",
    icon: Building2,
    href: "/carriers",
    color: "text-blue-600"
  },
  {
    title: "Tools",
    description: "Calculators and underwriting guides",
    icon: Calculator,
    href: "/tools",
    color: "text-green-600"
  },
  {
    title: "Training",
    description: "Learn new skills and techniques",
    icon: GraduationCap,
    href: "/training",
    color: "text-purple-600"
  },
  {
    title: "Marketing",
    description: "Templates and brand assets",
    icon: Megaphone,
    href: "/marketing",
    color: "text-orange-600"
  },
  {
    title: "Compliance",
    description: "Licenses and regulatory info",
    icon: Shield,
    href: "/compliance",
    color: "text-red-600"
  },
  {
    title: "AI Assist",
    description: "Get instant answers and help",
    icon: Bot,
    href: "/ai-assist",
    color: "text-indigo-600"
  }
];

export const QuickActions = () => {
  return (
    <Card className="stat-card">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Access your most-used tools and resources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <Link key={action.title} to={action.href}>
              <Button
                variant="outline"
                className="h-20 w-full flex-col space-y-2 hover-lift transition-smooth"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <action.icon className={`h-6 w-6 ${action.color}`} />
                <span className="text-sm font-medium">{action.title}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};