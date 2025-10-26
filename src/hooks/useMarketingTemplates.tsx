import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface MarketingTemplate {
  id: string;
  user_id: string;
  title: string;
  type: "canva_template" | "email_script" | "sms_script" | "brand_asset";
  description: string;
  content: string | null;
  url: string | null;
  file_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export const useMarketingTemplates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["marketingTemplates", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("user_marketing_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MarketingTemplate[];
    },
    enabled: !!user?.id,
  });

  const createTemplate = useMutation({
    mutationFn: async (data: Omit<MarketingTemplate, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data: newTemplate, error } = await supabase
        .from("user_marketing_templates")
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return newTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketingTemplates"] });
      toast.success("Template created successfully!");
    },
    onError: (error) => {
      toast.error("Failed to create template: " + error.message);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...data }: Partial<MarketingTemplate> & { id: string }) => {
      const { data: updatedTemplate, error } = await supabase
        .from("user_marketing_templates")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updatedTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketingTemplates"] });
      toast.success("Template updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update template: " + error.message);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_marketing_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketingTemplates"] });
      toast.success("Template deleted successfully!");
    },
    onError: (error) => {
      toast.error("Failed to delete template: " + error.message);
    },
  });

  const uploadAsset = async (file: File): Promise<string> => {
    if (!user?.id) throw new Error("User not authenticated");

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/assets/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("brand-assets")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    uploadAsset,
  };
};
