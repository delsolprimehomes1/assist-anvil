import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgentPerformance, PerformanceStats as Stats } from "@/hooks/useAgentPerformance";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, DollarSign, Target, Phone, Users, Percent, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  color?: string;
}

const KPICard = ({ title, value, subtitle, icon, trend, color = "primary" }: KPICardProps) => (
  <div className="bg-card border rounded-lg p-4">
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{title}</span>
      <div className={cn("p-2 rounded-full", `bg-${color}/10`)}>
        {icon}
      </div>
    </div>
    <div className="mt-2">
      <span className="text-2xl font-bold">{value}</span>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  </div>
);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

interface StatsDisplayProps {
  stats: Stats;
  period: string;
}

const StatsDisplay = ({ stats, period }: StatsDisplayProps) => {
  const funnelData = [
    { name: "Leads", value: stats.leadsWorked, color: "#3B82F6" },
    { name: "Dials", value: stats.dialsMade, color: "#8B5CF6" },
    { name: "Appts Set", value: stats.appointmentsSet, color: "#F59E0B" },
    { name: "Appts Held", value: stats.appointmentsHeld, color: "#10B981" },
    { name: "Closed", value: stats.clientsClosed, color: "#EF4444" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Revenue"
          value={formatCurrency(stats.revenue)}
          subtitle={`${period} total`}
          icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
        />
        <KPICard
          title="Close Rate"
          value={formatPercent(stats.closeRate)}
          subtitle="Held → Closed"
          icon={<Target className="h-4 w-4 text-primary" />}
        />
        <KPICard
          title="Contact Rate"
          value={formatPercent(stats.contactRate)}
          subtitle="Dials → Appts"
          icon={<Phone className="h-4 w-4 text-amber-500" />}
        />
        <KPICard
          title="ROI"
          value={formatPercent(stats.roi)}
          subtitle={`CPA: ${formatCurrency(stats.costPerAcquisition)}`}
          icon={<TrendingUp className="h-4 w-4 text-violet-500" />}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-accent/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{stats.leadsWorked}</p>
          <p className="text-xs text-muted-foreground">Leads Worked</p>
        </div>
        <div className="bg-accent/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{stats.dialsMade}</p>
          <p className="text-xs text-muted-foreground">Dials Made</p>
        </div>
        <div className="bg-accent/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{stats.clientsClosed}</p>
          <p className="text-xs text-muted-foreground">Clients Closed</p>
        </div>
      </div>

      {/* Funnel Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Show Rate */}
      <div className="flex items-center gap-4 p-4 bg-accent/30 rounded-lg">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">Show Rate (Appts Set → Held)</p>
          <p className="text-xl font-bold">{formatPercent(stats.showRate)}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm text-muted-foreground">Total Lead Cost</p>
          <p className="text-xl font-bold">{formatCurrency(stats.totalLeadCost)}</p>
        </div>
      </div>
    </div>
  );
};

export const PerformanceStatsPanel = () => {
  const [period, setPeriod] = useState("week");
  const { weeklyStats, monthlyStats, yearlyStats, loading } = useAgentPerformance();

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Performance Analytics
        </CardTitle>
        <CardDescription>Track your conversion metrics and ROI</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={period} onValueChange={setPeriod} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="year">YTD</TabsTrigger>
          </TabsList>

          <TabsContent value="week">
            <StatsDisplay stats={weeklyStats} period="Weekly" />
          </TabsContent>

          <TabsContent value="month">
            <StatsDisplay stats={monthlyStats} period="Monthly" />
          </TabsContent>

          <TabsContent value="year">
            <StatsDisplay stats={yearlyStats} period="YTD" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
