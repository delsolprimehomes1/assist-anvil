import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { MarketingResource } from "./useMarketingResources";

export const useAdminMarketingResources = (status?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["adminMarketingResources", status],
    queryFn: async () => {
      let query = supabase
        .from("marketing_resources")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MarketingResource[];
    },
    enabled: !!user,
  });

  const createResource = useMutation({
    mutationFn: async (data: Omit<MarketingResource, "id" | "created_at" | "updated_at">) => {
      const { data: newResource, error } = await supabase
        .from("marketing_resources")
        .insert([{ ...data, created_by: user?.id }])
        .select()
        .single();

      if (error) throw error;
      return newResource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMarketingResources"] });
      queryClient.invalidateQueries({ queryKey: ["marketingResources"] });
      toast.success("Resource created successfully!");
    },
    onError: (error) => {
      toast.error("Failed to create resource: " + error.message);
    },
  });

  const updateResource = useMutation({
    mutationFn: async ({ id, ...data }: Partial<MarketingResource> & { id: string }) => {
      const { data: updatedResource, error } = await supabase
        .from("marketing_resources")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updatedResource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMarketingResources"] });
      queryClient.invalidateQueries({ queryKey: ["marketingResources"] });
      toast.success("Resource updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update resource: " + error.message);
    },
  });

  const deleteResource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_resources")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMarketingResources"] });
      queryClient.invalidateQueries({ queryKey: ["marketingResources"] });
      toast.success("Resource deleted successfully!");
    },
    onError: (error) => {
      toast.error("Failed to delete resource: " + error.message);
    },
  });

  const uploadFile = async (file: File, folder: string = "files"): Promise<string> => {
    if (!user?.id) throw new Error("User not authenticated");

    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("marketing-resources")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("marketing-resources")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  return {
    resources,
    isLoading,
    createResource,
    updateResource,
    deleteResource,
    uploadFile,
  };
};
