import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type NewsType = 
  | "state_approval" 
  | "product_update" 
  | "new_product" 
  | "rate_change" 
  | "underwriting_change" 
  | "general";

export type NewsPriority = "high" | "normal" | "low";
export type NewsStatus = "draft" | "published" | "archived";

export interface CarrierNews {
  id: string;
  title: string;
  content: string;
  news_type: NewsType;
  carrier_id: string | null;
  carrier_name: string | null;
  priority: NewsPriority;
  published_date: string;
  archive_date: string | null;
  status: NewsStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  attachment_url: string | null;
  tags: string[];
  views_count: number;
}

export interface NewsFilters {
  search?: string;
  newsType?: NewsType;
  carrierId?: string;
  includeArchived?: boolean;
}

export const useCarrierNews = (filters?: NewsFilters) => {
  return useQuery({
    queryKey: ["carrier-news", filters],
    queryFn: async () => {
      let query = supabase
        .from("carrier_news")
        .select("*")
        .order("priority", { ascending: false })
        .order("published_date", { ascending: false });

      // Apply filters
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      if (filters?.newsType) {
        query = query.eq("news_type", filters.newsType);
      }

      if (filters?.carrierId) {
        query = query.eq("carrier_id", filters.carrierId);
      }

      if (!filters?.includeArchived) {
        query = query.eq("status", "published");
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CarrierNews[];
    },
  });
};

export const useAdminCarrierNews = (status?: NewsStatus) => {
  return useQuery({
    queryKey: ["admin-carrier-news", status],
    queryFn: async () => {
      let query = supabase
        .from("carrier_news")
        .select("*")
        .order("updated_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CarrierNews[];
    },
  });
};

export const useCreateCarrierNews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (news: Omit<CarrierNews, "id" | "created_at" | "updated_at" | "views_count" | "created_by">) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("carrier_news")
        .insert({ ...news, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carrier-news"] });
      queryClient.invalidateQueries({ queryKey: ["admin-carrier-news"] });
      toast.success("News created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create news: ${error.message}`);
    },
  });
};

export const useUpdateCarrierNews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CarrierNews> & { id: string }) => {
      const { data, error } = await supabase
        .from("carrier_news")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carrier-news"] });
      queryClient.invalidateQueries({ queryKey: ["admin-carrier-news"] });
      toast.success("News updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update news: ${error.message}`);
    },
  });
};

export const useDeleteCarrierNews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("carrier_news")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carrier-news"] });
      queryClient.invalidateQueries({ queryKey: ["admin-carrier-news"] });
      toast.success("News deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete news: ${error.message}`);
    },
  });
};

export const useIncrementNewsViews = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch current count
      const { data, error: fetchError } = await supabase
        .from("carrier_news")
        .select("views_count")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Increment
      const { error } = await supabase
        .from("carrier_news")
        .update({ views_count: (data?.views_count || 0) + 1 })
        .eq("id", id);
      
      if (error) throw error;
    },
  });
};
