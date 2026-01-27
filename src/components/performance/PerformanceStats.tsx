import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgentPerformance, PerformanceStats as Stats } from "@/hooks/useAgentPerformance";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Target, Users, Loader2, Receipt, Wallet, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  compact?: boolean;
}

const KPICard = ({ title, value, subtitle, icon, compact = false }: KPICardProps) => (
  <div className={cn(
    "bg-card border rounded-xl",
    compact ? "p-3" : "p-3 sm:p-4"
  )}>
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{title}</span>
      <div className="p-1.5 sm:p-2 rounded-full bg-muted shrink-0">
        {icon}
      </div>
    </div>
    <div className="mt-1 sm:mt-2">
      <span className={cn(
        "font-bold",
        compact ? "text-lg" : "text-lg sm:text-2xl"
      )}>{value}</span>
      {subtitle && (
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
      )}
    </div>
  </div>
);

const formatCurrency = (value: number) => {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCurrencyFull = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
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
    { name: "Set", value: stats.appointmentsSet, color: "#F59E0B" },
    { name: "Held", value: stats.appointmentsHeld, color: "#10B981" },
    { name: "Closed", value: stats.clientsClosed, color: "#EF4444" },
  ];

  const isProfit = stats.netProfit >= 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Grid - 2x2 on mobile, 5 cols on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <KPICard
          title="Revenue"
          value={formatCurrency(stats.revenue)}
          subtitle={period}
          icon={<DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />}
          compact
        />
        <KPICard
          title="Leads"
          value={stats.totalLeadsPurchased}
          subtitle={formatCurrency(stats.totalLeadCost)}
          icon={<Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />}
          compact
        />
        <KPICard
          title="Issue Pay"
          value={formatCurrency(stats.totalIssuePay)}
          subtitle="Due now"
          icon={<Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />}
          compact
        />
        <KPICard
          title="Close Rate"
          value={formatPercent(stats.closeRate)}
          subtitle="Held → Close"
          icon={<Target className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />}
          compact
        />
        <div className="col-span-2 sm:col-span-1">
          <KPICard
            title="ROI"
            value={formatPercent(stats.roi)}
            subtitle={`CPA: ${formatCurrency(stats.costPerAcquisition)}`}
            icon={<TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-violet-500" />}
            compact
          />
        </div>
      </div>

      {/* Net Profit/Loss Card - Compact on mobile */}
      <div className={cn(
        "p-3 sm:p-4 rounded-xl border-2 transition-colors",
        isProfit 
          ? "bg-green-500/10 border-green-500/30" 
          : "bg-red-500/10 border-red-500/30"
      )}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-xs sm:text-sm font-medium mb-1">
              {isProfit ? (
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 shrink-0" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 shrink-0" />
              )}
              <span className={cn(
                "truncate",
                isProfit ? "text-green-700" : "text-red-700"
              )}>
                {isProfit ? "Net Profit" : "In the Hole"}
              </span>
            </div>
            <span className={cn(
              "text-xl sm:text-2xl font-bold",
              isProfit ? "text-green-600" : "text-red-600"
            )}>
              {isProfit ? "+" : "-"}{formatCurrencyFull(Math.abs(stats.netProfit))}
            </span>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
              {formatCurrency(stats.totalIssuePay)} - {formatCurrency(stats.totalLeadCost)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Comp Level</p>
            <p className="text-base sm:text-lg font-bold">{stats.avgCompLevel.toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Commission Breakdown - Stacked on mobile */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-green-700 mb-1 sm:mb-2">
            <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="font-medium truncate">Issue Pay</span>
          </div>
          <span className="text-lg sm:text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalIssuePay)}
          </span>
        </div>
        
        <div className="p-3 sm:p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-700 mb-1 sm:mb-2">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="font-medium truncate">Deferred</span>
          </div>
          <span className="text-lg sm:text-2xl font-bold text-blue-600">
            {formatCurrency(stats.totalDeferredPay)}
          </span>
        </div>
      </div>

      {/* Activity Stats - Compact grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-accent/50 rounded-xl p-2.5 sm:p-3 text-center">
          <p className="text-lg sm:text-2xl font-bold">{stats.leadsWorked}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Leads</p>
        </div>
        <div className="bg-accent/50 rounded-xl p-2.5 sm:p-3 text-center">
          <p className="text-lg sm:text-2xl font-bold">{stats.dialsMade}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Dials</p>
        </div>
        <div className="bg-accent/50 rounded-xl p-2.5 sm:p-3 text-center">
          <p className="text-lg sm:text-2xl font-bold">{stats.clientsClosed}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Closed</p>
        </div>
      </div>

      {/* Funnel Chart - Shorter on mobile */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
          <div className="h-[150px] sm:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={45} tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
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

      {/* Show Rate & Contact Rate - Compact */}
      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-accent/30 rounded-xl">
        <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] sm:text-sm text-muted-foreground">Show Rate</p>
          <p className="text-base sm:text-xl font-bold">{formatPercent(stats.showRate)}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[10px] sm:text-sm text-muted-foreground">Contact</p>
          <p className="text-base sm:text-xl font-bold">{formatPercent(stats.contactRate)}</p>
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
        <CardContent className="flex items-center justify-center h-[300px] sm:h-[400px]">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 sm:pb-6 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Analytics
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Track metrics, ROI & commissions
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
        <Tabs value={period} onValueChange={setPeriod} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-9 sm:h-10">
            <TabsTrigger value="week" className="text-xs sm:text-sm">Week</TabsTrigger>
            <TabsTrigger value="month" className="text-xs sm:text-sm">Month</TabsTrigger>
            <TabsTrigger value="year" className="text-xs sm:text-sm">YTD</TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="mt-0">
            <StatsDisplay stats={weeklyStats} period="Weekly" />
          </TabsContent>

          <TabsContent value="month" className="mt-0">
            <StatsDisplay stats={monthlyStats} period="Monthly" />
          </TabsContent>

          <TabsContent value="year" className="mt-0">
            <StatsDisplay stats={yearlyStats} period="YTD" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
