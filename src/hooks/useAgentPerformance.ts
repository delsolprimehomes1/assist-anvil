import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { startOfWeek, startOfMonth, startOfYear, format } from "date-fns";

export interface PerformanceEntry {
  id: string;
  agentId: string;
  entryDate: string;
  leadType: string;
  leadsWorked: number;
  dialsMade: number;
  appointmentsSet: number;
  appointmentsHeld: number;
  clientsClosed: number;
  revenue: number;
  costPerLead: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // New fields
  leadsPurchased: number;
  discountPercent: number;
  totalLeadCost: number;
  compLevelPercent: number;
  advancementPercent: number;
  expectedIssuePay: number;
  expectedDeferredPay: number;
}

export interface PerformanceStats {
  leadsWorked: number;
  dialsMade: number;
  appointmentsSet: number;
  appointmentsHeld: number;
  clientsClosed: number;
  revenue: number;
  totalLeadCost: number;
  contactRate: number;
  showRate: number;
  closeRate: number;
  roi: number;
  costPerAcquisition: number;
  // New aggregations
  totalIssuePay: number;
  totalDeferredPay: number;
  netProfit: number;
  avgCompLevel: number;
  totalLeadsPurchased: number;
}

interface UseAgentPerformanceReturn {
  entries: PerformanceEntry[];
  weeklyStats: PerformanceStats;
  monthlyStats: PerformanceStats;
  yearlyStats: PerformanceStats;
  loading: boolean;
  error: string | null;
  addEntry: (entry: Partial<PerformanceEntry>) => Promise<void>;
  updateEntry: (id: string, entry: Partial<PerformanceEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
  getDownlinePerformance: (agentUserId: string) => Promise<PerformanceEntry[]>;
}

const emptyStats: PerformanceStats = {
  leadsWorked: 0,
  dialsMade: 0,
  appointmentsSet: 0,
  appointmentsHeld: 0,
  clientsClosed: 0,
  revenue: 0,
  totalLeadCost: 0,
  contactRate: 0,
  showRate: 0,
  closeRate: 0,
  roi: 0,
  costPerAcquisition: 0,
  totalIssuePay: 0,
  totalDeferredPay: 0,
  netProfit: 0,
  avgCompLevel: 0,
  totalLeadsPurchased: 0,
};

function calculateStats(entries: PerformanceEntry[]): PerformanceStats {
  if (entries.length === 0) return emptyStats;

  const totals = entries.reduce(
    (acc, entry) => ({
      leadsWorked: acc.leadsWorked + entry.leadsWorked,
      dialsMade: acc.dialsMade + entry.dialsMade,
      appointmentsSet: acc.appointmentsSet + entry.appointmentsSet,
      appointmentsHeld: acc.appointmentsHeld + entry.appointmentsHeld,
      clientsClosed: acc.clientsClosed + entry.clientsClosed,
      revenue: acc.revenue + entry.revenue,
      totalLeadCost: acc.totalLeadCost + entry.totalLeadCost,
      totalIssuePay: acc.totalIssuePay + entry.expectedIssuePay,
      totalDeferredPay: acc.totalDeferredPay + entry.expectedDeferredPay,
      compLevelSum: acc.compLevelSum + entry.compLevelPercent,
      totalLeadsPurchased: acc.totalLeadsPurchased + entry.leadsPurchased,
    }),
    {
      leadsWorked: 0,
      dialsMade: 0,
      appointmentsSet: 0,
      appointmentsHeld: 0,
      clientsClosed: 0,
      revenue: 0,
      totalLeadCost: 0,
      totalIssuePay: 0,
      totalDeferredPay: 0,
      compLevelSum: 0,
      totalLeadsPurchased: 0,
    }
  );

  const contactRate = totals.dialsMade > 0 
    ? (totals.appointmentsSet / totals.dialsMade) * 100 
    : 0;
  const showRate = totals.appointmentsSet > 0 
    ? (totals.appointmentsHeld / totals.appointmentsSet) * 100 
    : 0;
  const closeRate = totals.appointmentsHeld > 0 
    ? (totals.clientsClosed / totals.appointmentsHeld) * 100 
    : 0;
  // ROI based on Issue Pay vs Lead Cost (what agent actually receives)
  const roi = totals.totalLeadCost > 0 
    ? ((totals.totalIssuePay - totals.totalLeadCost) / totals.totalLeadCost) * 100 
    : 0;
  const costPerAcquisition = totals.clientsClosed > 0 
    ? totals.totalLeadCost / totals.clientsClosed 
    : 0;
  // Net Profit = Issue Pay - Lead Cost (what agent receives minus what they spent)
  const netProfit = totals.totalIssuePay - totals.totalLeadCost;
  const avgCompLevel = entries.length > 0 ? totals.compLevelSum / entries.length : 0;

  return {
    ...totals,
    contactRate,
    showRate,
    closeRate,
    roi,
    costPerAcquisition,
    netProfit,
    avgCompLevel,
    totalLeadsPurchased: totals.totalLeadsPurchased,
  };
}

export const useAgentPerformance = (agentId?: string): UseAgentPerformanceReturn => {
  const [entries, setEntries] = useState<PerformanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const targetAgentId = agentId || user?.id;

  const fetchEntries = useCallback(async () => {
    if (!targetAgentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("agent_performance_entries")
        .select("*")
        .eq("agent_id", targetAgentId)
        .order("entry_date", { ascending: false });

      if (fetchError) throw fetchError;

      const transformedEntries: PerformanceEntry[] = (data || []).map((row: any) => ({
        id: row.id,
        agentId: row.agent_id,
        entryDate: row.entry_date,
        leadType: row.lead_type,
        leadsWorked: row.leads_worked || 0,
        dialsMade: row.dials_made || 0,
        appointmentsSet: row.appointments_set || 0,
        appointmentsHeld: row.appointments_held || 0,
        clientsClosed: row.clients_closed || 0,
        revenue: parseFloat(row.revenue) || 0,
        costPerLead: parseFloat(row.cost_per_lead) || 0,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        // New fields
        leadsPurchased: row.leads_purchased || 0,
        discountPercent: parseFloat(row.discount_percent) || 0,
        totalLeadCost: parseFloat(row.total_lead_cost) || 0,
        compLevelPercent: parseFloat(row.comp_level_percent) || 100,
        advancementPercent: parseFloat(row.advancement_percent) || 75,
        expectedIssuePay: parseFloat(row.expected_issue_pay) || 0,
        expectedDeferredPay: parseFloat(row.expected_deferred_pay) || 0,
      }));

      setEntries(transformedEntries);
    } catch (err) {
      console.error("Error fetching performance entries:", err);
      setError(err instanceof Error ? err.message : "Failed to load performance data");
    } finally {
      setLoading(false);
    }
  }, [targetAgentId]);

  // Initial fetch
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Real-time subscription
  useEffect(() => {
    if (!targetAgentId) return;

    const channel = supabase
      .channel(`performance-${targetAgentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_performance_entries",
          filter: `agent_id=eq.${targetAgentId}`,
        },
        (payload) => {
          console.log("Performance entry change:", payload);
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetAgentId, fetchEntries]);

  // Calculate stats by period
  const weeklyStats = useMemo(() => {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const weeklyEntries = entries.filter((e) => e.entryDate >= weekStart);
    return calculateStats(weeklyEntries);
  }, [entries]);

  const monthlyStats = useMemo(() => {
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const monthlyEntries = entries.filter((e) => e.entryDate >= monthStart);
    return calculateStats(monthlyEntries);
  }, [entries]);

  const yearlyStats = useMemo(() => {
    const yearStart = format(startOfYear(new Date()), "yyyy-MM-dd");
    const yearlyEntries = entries.filter((e) => e.entryDate >= yearStart);
    return calculateStats(yearlyEntries);
  }, [entries]);

  const addEntry = async (entry: Partial<PerformanceEntry>) => {
    if (!user?.id) {
      toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
      return;
    }

    const { error: insertError } = await supabase.from("agent_performance_entries").insert({
      agent_id: user.id,
      entry_date: entry.entryDate || format(new Date(), "yyyy-MM-dd"),
      lead_type: entry.leadType || "Unknown",
      leads_worked: entry.leadsWorked || 0,
      dials_made: entry.dialsMade || 0,
      appointments_set: entry.appointmentsSet || 0,
      appointments_held: entry.appointmentsHeld || 0,
      clients_closed: entry.clientsClosed || 0,
      revenue: entry.revenue || 0,
      cost_per_lead: entry.costPerLead || 0,
      notes: entry.notes || null,
      // New fields
      leads_purchased: entry.leadsPurchased || 0,
      discount_percent: entry.discountPercent || 0,
      total_lead_cost: entry.totalLeadCost || 0,
      comp_level_percent: entry.compLevelPercent || 100,
      advancement_percent: entry.advancementPercent || 75,
      expected_issue_pay: entry.expectedIssuePay || 0,
      expected_deferred_pay: entry.expectedDeferredPay || 0,
    });

    if (insertError) {
      toast({ title: "Error", description: insertError.message, variant: "destructive" });
      throw insertError;
    }

    toast({ title: "Success", description: "Performance entry logged" });
    await fetchEntries(); // Immediately refresh data
  };

  const updateEntry = async (id: string, entry: Partial<PerformanceEntry>) => {
    const { error: updateError } = await supabase
      .from("agent_performance_entries")
      .update({
        lead_type: entry.leadType,
        leads_worked: entry.leadsWorked,
        dials_made: entry.dialsMade,
        appointments_set: entry.appointmentsSet,
        appointments_held: entry.appointmentsHeld,
        clients_closed: entry.clientsClosed,
        revenue: entry.revenue,
        cost_per_lead: entry.costPerLead,
        notes: entry.notes,
        leads_purchased: entry.leadsPurchased,
        discount_percent: entry.discountPercent,
        total_lead_cost: entry.totalLeadCost,
        comp_level_percent: entry.compLevelPercent,
        advancement_percent: entry.advancementPercent,
        expected_issue_pay: entry.expectedIssuePay,
        expected_deferred_pay: entry.expectedDeferredPay,
      })
      .eq("id", id);

    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
      throw updateError;
    }

    toast({ title: "Updated", description: "Performance entry updated" });
    await fetchEntries(); // Immediately refresh data
  };

  const deleteEntry = async (id: string) => {
    const { error: deleteError } = await supabase
      .from("agent_performance_entries")
      .delete()
      .eq("id", id);

    if (deleteError) {
      toast({ title: "Error", description: deleteError.message, variant: "destructive" });
      throw deleteError;
    }

    toast({ title: "Deleted", description: "Performance entry removed" });
    await fetchEntries(); // Immediately refresh data
  };

  const getDownlinePerformance = async (agentUserId: string): Promise<PerformanceEntry[]> => {
    const { data, error: fetchError } = await supabase
      .from("agent_performance_entries")
      .select("*")
      .eq("agent_id", agentUserId)
      .order("entry_date", { ascending: false });

    if (fetchError) throw fetchError;

    return (data || []).map((row: any) => ({
      id: row.id,
      agentId: row.agent_id,
      entryDate: row.entry_date,
      leadType: row.lead_type,
      leadsWorked: row.leads_worked || 0,
      dialsMade: row.dials_made || 0,
      appointmentsSet: row.appointments_set || 0,
      appointmentsHeld: row.appointments_held || 0,
      clientsClosed: row.clients_closed || 0,
      revenue: parseFloat(row.revenue) || 0,
      costPerLead: parseFloat(row.cost_per_lead) || 0,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      leadsPurchased: row.leads_purchased || 0,
      discountPercent: parseFloat(row.discount_percent) || 0,
      totalLeadCost: parseFloat(row.total_lead_cost) || 0,
      compLevelPercent: parseFloat(row.comp_level_percent) || 100,
      advancementPercent: parseFloat(row.advancement_percent) || 75,
      expectedIssuePay: parseFloat(row.expected_issue_pay) || 0,
      expectedDeferredPay: parseFloat(row.expected_deferred_pay) || 0,
    }));
  };

  return {
    entries,
    weeklyStats,
    monthlyStats,
    yearlyStats,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    refetch: fetchEntries,
    getDownlinePerformance,
  };
};
