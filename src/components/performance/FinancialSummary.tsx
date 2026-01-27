import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Receipt, Wallet, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialSummaryProps {
  totalRevenue: number;
  totalLeadSpend: number;
  totalIssuePay: number;
  totalDeferredPay: number;
}

export const FinancialSummary = ({
  totalRevenue,
  totalLeadSpend,
  totalIssuePay,
  totalDeferredPay,
}: FinancialSummaryProps) => {
  const netProfit = totalRevenue - totalLeadSpend;
  const isProfit = netProfit >= 0;
  const roi = totalLeadSpend > 0 ? ((netProfit / totalLeadSpend) * 100) : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5 text-primary" />
          Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              Business Written
            </div>
            <span className="text-xl font-bold">${totalRevenue.toFixed(2)}</span>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Receipt className="h-3 w-3" />
              Lead Investment
            </div>
            <span className="text-xl font-bold">${totalLeadSpend.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Net Profit/Loss */}
        <div className={cn(
          "p-4 rounded-lg border-2 transition-colors",
          isProfit 
            ? "bg-green-500/10 border-green-500/30" 
            : "bg-red-500/10 border-red-500/30"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1 text-sm font-medium mb-1">
                {isProfit ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={isProfit ? "text-green-700" : "text-red-700"}>
                  Net {isProfit ? "Profit" : "Loss"}
                </span>
              </div>
              <span className={cn(
                "text-2xl font-bold",
                isProfit ? "text-green-600" : "text-red-600"
              )}>
                {isProfit ? "+" : "-"}${Math.abs(netProfit).toFixed(2)}
              </span>
            </div>
            <div className={cn(
              "text-right px-3 py-1 rounded-full text-sm font-medium",
              isProfit ? "bg-green-500/20 text-green-700" : "bg-red-500/20 text-red-700"
            )}>
              {roi > 0 ? "+" : ""}{roi.toFixed(0)}% ROI
            </div>
          </div>
        </div>
        
        {/* Commission Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-1 text-xs text-green-700 mb-1">
              <TrendingUp className="h-3 w-3" />
              Issue Pay Due
            </div>
            <span className="text-lg font-bold text-green-600">
              ${totalIssuePay.toFixed(2)}
            </span>
          </div>
          
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-1 text-xs text-blue-700 mb-1">
              <Clock className="h-3 w-3" />
              Deferred (9 mo)
            </div>
            <span className="text-lg font-bold text-blue-600">
              ${totalDeferredPay.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
