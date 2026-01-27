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
      totalLeadCost: acc.totalLeadCost + (entry.costPerLead * entry.leadsWorked),
    }),
    {
      leadsWorked: 0,
      dialsMade: 0,
      appointmentsSet: 0,
      appointmentsHeld: 0,
      clientsClosed: 0,
      revenue: 0,
      totalLeadCost: 0,
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
  const roi = totals.totalLeadCost > 0 
    ? ((totals.revenue - totals.totalLeadCost) / totals.totalLeadCost) * 100 
    : 0;
  const costPerAcquisition = totals.clientsClosed > 0 
    ? totals.totalLeadCost / totals.clientsClosed 
    : 0;

  return {
    ...totals,
    contactRate,
    showRate,
    closeRate,
    roi,
    costPerAcquisition,
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
    });

    if (insertError) {
      toast({ title: "Error", description: insertError.message, variant: "destructive" });
      throw insertError;
    }

    toast({ title: "Success", description: "Performance entry logged" });
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
      })
      .eq("id", id);

    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
      throw updateError;
    }

    toast({ title: "Updated", description: "Performance entry updated" });
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
