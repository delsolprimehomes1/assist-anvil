import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface BrandKit {
  id: string;
  user_id: string;
  company_name: string;
  logo_url: string | null;
  agent_photo_url: string | null;
  secondary_logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  tagline: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  font_heading: string;
  font_body: string;
  brand_voice: string | null;
  credentials_display: string | null;
  created_at: string;
  updated_at: string;
}

export const useBrandKit = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: brandKit, isLoading } = useQuery({
    queryKey: ["brandKit", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("user_brand_kits")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as BrandKit | null;
    },
    enabled: !!user?.id,
  });

  const createBrandKit = useMutation({
    mutationFn: async (data: Omit<BrandKit, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data: newBrandKit, error } = await supabase
        .from("user_brand_kits")
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return newBrandKit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brandKit"] });
      toast.success("Brand kit created successfully!");
    },
    onError: (error) => {
      toast.error("Failed to create brand kit: " + error.message);
    },
  });

  const updateBrandKit = useMutation({
    mutationFn: async (data: Partial<BrandKit>) => {
      if (!user?.id || !brandKit?.id) throw new Error("No brand kit to update");

      const { data: updatedBrandKit, error } = await supabase
        .from("user_brand_kits")
        .update(data)
        .eq("id", brandKit.id)
        .select()
        .single();

      if (error) throw error;
      return updatedBrandKit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brandKit"] });
      toast.success("Brand kit updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update brand kit: " + error.message);
    },
  });

  const uploadLogo = async (file: File): Promise<string> => {
    if (!user?.id) throw new Error("User not authenticated");

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/logo.${fileExt}`;

    // Delete old logo if exists
    if (brandKit?.logo_url) {
      const oldPath = brandKit.logo_url.split("/").slice(-2).join("/");
      await supabase.storage.from("brand-assets").remove([oldPath]);
    }

    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("brand-assets")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const uploadAgentPhoto = async (file: File): Promise<string> => {
    if (!user?.id) throw new Error("User not authenticated");

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/agent-photo.${fileExt}`;

    if (brandKit?.agent_photo_url) {
      const oldPath = brandKit.agent_photo_url.split("/").slice(-2).join("/");
      await supabase.storage.from("brand-assets").remove([oldPath]);
    }

    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("brand-assets")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const uploadSecondaryLogo = async (file: File): Promise<string> => {
    if (!user?.id) throw new Error("User not authenticated");

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/secondary-logo.${fileExt}`;

    if (brandKit?.secondary_logo_url) {
      const oldPath = brandKit.secondary_logo_url.split("/").slice(-2).join("/");
      await supabase.storage.from("brand-assets").remove([oldPath]);
    }

    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("brand-assets")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  return {
    brandKit,
    isLoading,
    createBrandKit,
    updateBrandKit,
    uploadLogo,
    uploadAgentPhoto,
    uploadSecondaryLogo,
  };
};
