import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

type LicenseStatus = "active" | "expiring_soon" | "expired" | "pending";

const calculateStatus = (expirationDate: string): LicenseStatus => {
  const today = new Date();
  const expiration = new Date(expirationDate);
  const daysUntil = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil < 0) return "expired";
  if (daysUntil <= 90) return "expiring_soon";
  return "active";
};

export const useNonResidentLicenses = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: licenses = [], isLoading, error } = useQuery({
    queryKey: ["non-resident-licenses", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("non_resident_licenses")
        .select("*")
        .eq("agent_id", user.id)
        .order("expiration_date", { ascending: true });

      if (error) throw error;

      // Calculate status for each license
      return (data || []).map((license) => ({
        ...license,
        status: calculateStatus(license.expiration_date),
      }));
    },
    enabled: !!user?.id,
  });

  const createLicense = useMutation({
    mutationFn: async (newLicense: {
      state: string;
      license_number: string;
      expiration_date: string;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("non_resident_licenses")
        .insert({
          agent_id: user.id,
          ...newLicense,
          status: calculateStatus(newLicense.expiration_date),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["non-resident-licenses"] });
      toast({
        title: "License added",
        description: "Your non-resident license has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateLicense = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from("non_resident_licenses")
        .update({
          ...updates,
          status: updates.expiration_date ? calculateStatus(updates.expiration_date) : undefined,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["non-resident-licenses"] });
      toast({
        title: "License updated",
        description: "Your license has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteLicense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("non_resident_licenses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["non-resident-licenses"] });
      toast({
        title: "License deleted",
        description: "Your license has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    licenses,
    isLoading,
    error,
    createLicense,
    updateLicense,
    deleteLicense,
  };
};
