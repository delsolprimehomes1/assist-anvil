import { TrendingUp, DollarSign, Target, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    title: "Policies This Month",
    value: "24",
    change: "+12%",
    trend: "up",
    icon: Target,
    description: "vs last month"
  },
  {
    title: "Annual Premium",
    value: "$89,400",
    change: "+8%",
    trend: "up",
    icon: DollarSign,
    description: "total volume"
  },
  {
    title: "Close Rate",
    value: "68%",
    change: "+5%",
    trend: "up",
    icon: TrendingUp,
    description: "this quarter"
  },
  {
    title: "Active Leads",
    value: "42",
    change: "-3",
    trend: "down",
    icon: Users,
    description: "in pipeline"
  }
];

export const StatsCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={stat.title} className="stat-card hover-lift" style={{ animationDelay: `${index * 0.1}s` }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="flex items-center space-x-2 text-xs">
              <span className={`font-medium ${
                stat.trend === 'up' ? 'text-success' : 'text-destructive'
              }`}>
                {stat.change}
              </span>
              <span className="text-muted-foreground">{stat.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};