import { useState } from "react";
import { PerformanceForm } from "@/components/performance/PerformanceForm";
import { PerformanceStatsPanel } from "@/components/performance/PerformanceStats";
import { PerformanceEntriesList } from "@/components/performance/PerformanceEntriesList";
import { useAgentPerformance } from "@/hooks/useAgentPerformance";
import { BarChart3, Plus, TrendingUp, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Performance = () => {
  const { entries, loading, updateEntry, deleteEntry } = useAgentPerformance();
  const [activeTab, setActiveTab] = useState("log");

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] animate-fade-in">
      {/* Compact Mobile Header */}
      <div className="px-4 py-4 sm:px-6 sm:py-6 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Performance</h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Log activity & track metrics
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation - Fixed at top on mobile */}
      <div className="lg:hidden sticky top-[73px] z-10 bg-background border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 rounded-none bg-muted/50">
            <TabsTrigger value="log" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background">
              <Plus className="h-4 w-4" />
              <span>Log</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background">
              <TrendingUp className="h-4 w-4" />
              <span>Stats</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background">
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          {/* Mobile Tab Content */}
          <TabsContent value="log" className="mt-0 p-4">
            <PerformanceForm />
          </TabsContent>

          <TabsContent value="stats" className="mt-0 p-4">
            <PerformanceStatsPanel />
          </TabsContent>

          <TabsContent value="history" className="mt-0 p-4">
            <PerformanceEntriesList
              entries={entries}
              onUpdate={updateEntry}
              onDelete={deleteEntry}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Layout - Side by side */}
      <div className="hidden lg:block flex-1 p-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Panel - Log Form */}
          <div className="col-span-1">
            <PerformanceForm />
          </div>

          {/* Right Panel - Analytics */}
          <div className="col-span-2">
            <PerformanceStatsPanel />
          </div>
        </div>

        {/* Entry History - Full Width */}
        <div className="mt-6">
          <PerformanceEntriesList
            entries={entries}
            onUpdate={updateEntry}
            onDelete={deleteEntry}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Performance;
