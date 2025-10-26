import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export const useComplianceRecords = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: complianceRecord, isLoading, error } = useQuery({
    queryKey: ["compliance-records", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("compliance_records")
        .select("*")
        .eq("agent_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateComplianceRecord = useMutation({
    mutationFn: async (updates: any) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("compliance_records")
        .upsert({
          agent_id: user.id,
          ...updates,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-records"] });
      toast({
        title: "Compliance record updated",
        description: "Your compliance information has been updated successfully.",
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
    complianceRecord,
    isLoading,
    error,
    updateComplianceRecord,
  };
};
