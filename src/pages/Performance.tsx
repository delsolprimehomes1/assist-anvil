import { PerformanceForm } from "@/components/performance/PerformanceForm";
import { PerformanceStatsPanel } from "@/components/performance/PerformanceStats";
import { BarChart3 } from "lucide-react";

const Performance = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          Performance Tracker
        </h1>
        <p className="text-muted-foreground">
          Log your daily activity and track your conversion metrics in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Log Form */}
        <div className="lg:col-span-1">
          <PerformanceForm />
        </div>

        {/* Right Panel - Analytics */}
        <div className="lg:col-span-2">
          <PerformanceStatsPanel />
        </div>
      </div>
    </div>
  );
};

export default Performance;
