import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ZoneConfig {
  id: string;
  zone_key: string;
  label: string;
  description: string;
  color: string;
  display_order: number;
}

// Default fallback values if database is empty
const defaultZoneConfigs: Omit<ZoneConfig, 'id'>[] = [
  { zone_key: 'red', label: 'Critical', description: 'License expired or expiring within 7 days', color: '#EF4444', display_order: 1 },
  { zone_key: 'blue', label: 'Onboarding', description: 'New agent, verification incomplete', color: '#3B82F6', display_order: 2 },
  { zone_key: 'black', label: 'Inactive', description: 'No activity for 7+ days', color: '#64748B', display_order: 3 },
  { zone_key: 'yellow', label: 'Warning', description: 'Pending contracts or license expiring soon', color: '#F59E0B', display_order: 4 },
  { zone_key: 'green', label: 'Active', description: 'All systems operational', color: '#10B981', display_order: 5 },
];

export function useZoneConfig() {
  const [zoneConfigs, setZoneConfigs] = useState<ZoneConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const fetchZoneConfigs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('zone_config')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setZoneConfigs(data);
      } else {
        // Use defaults as fallback with generated IDs
        setZoneConfigs(defaultZoneConfigs.map((config, i) => ({
          ...config,
          id: `default-${i}`,
        })));
      }
    } catch (error) {
      console.error('Error fetching zone configs:', error);
      // Use defaults on error
      setZoneConfigs(defaultZoneConfigs.map((config, i) => ({
        ...config,
        id: `default-${i}`,
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateZoneConfig = useCallback(async (
    id: string,
    updates: { label?: string; description?: string }
  ) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('zone_config')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Zone updated",
        description: "The zone configuration has been saved.",
      });

      // Refetch to ensure consistency
      await fetchZoneConfigs();
    } catch (error) {
      console.error('Error updating zone config:', error);
      toast({
        title: "Error",
        description: "Failed to update zone configuration.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  }, [fetchZoneConfigs, toast]);

  const updateAllZoneConfigs = useCallback(async (
    configs: { id: string; label: string; description: string }[]
  ) => {
    setUpdating(true);
    try {
      for (const config of configs) {
        const { error } = await supabase
          .from('zone_config')
          .update({ label: config.label, description: config.description })
          .eq('id', config.id);

        if (error) throw error;
      }

      toast({
        title: "Zones updated",
        description: "All zone configurations have been saved.",
      });

      await fetchZoneConfigs();
    } catch (error) {
      console.error('Error updating zone configs:', error);
      toast({
        title: "Error",
        description: "Failed to update zone configurations.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  }, [fetchZoneConfigs, toast]);

  // Get color for a specific zone key
  const getZoneColor = useCallback((zoneKey: string): string => {
    const config = zoneConfigs.find(c => c.zone_key === zoneKey);
    return config?.color || '#64748B';
  }, [zoneConfigs]);

  // Get config for a specific zone key
  const getZoneConfig = useCallback((zoneKey: string): ZoneConfig | undefined => {
    return zoneConfigs.find(c => c.zone_key === zoneKey);
  }, [zoneConfigs]);

  // Initial fetch
  useEffect(() => {
    fetchZoneConfigs();
  }, [fetchZoneConfigs]);

  // Real-time subscription for instant updates across all clients
  useEffect(() => {
    const channel = supabase
      .channel('zone-config-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'zone_config',
        },
        () => {
          // Refetch on any change
          fetchZoneConfigs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchZoneConfigs]);

  return {
    zoneConfigs,
    loading,
    updating,
    updateZoneConfig,
    updateAllZoneConfigs,
    getZoneColor,
    getZoneConfig,
    refetch: fetchZoneConfigs,
  };
}
