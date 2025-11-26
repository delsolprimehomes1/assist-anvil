import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketingResource {
  id: string;
  title: string;
  type: string;
  description: string;
  content: string | null;
  url: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  tags: string[];
  category: string | null;
  status: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const useMarketingResources = (type?: string) => {
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["marketingResources", type],
    queryFn: async () => {
      let query = supabase
        .from("marketing_resources")
        .select("*")
        .eq("status", "published")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MarketingResource[];
    },
  });

  return {
    resources,
    isLoading,
  };
};
