import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface LeadProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  minQuantity: number;
  expectedConversion: number | null;
  badge: string | null;
  status: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface UseLeadProductsReturn {
  products: LeadProduct[];
  activeProducts: LeadProduct[];
  loading: boolean;
  error: string | null;
  addProduct: (product: Partial<LeadProduct>) => Promise<void>;
  updateProduct: (id: string, product: Partial<LeadProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useLeadProducts = (): UseLeadProductsReturn => {
  const [products, setProducts] = useState<LeadProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("lead_products")
        .select("*")
        .order("display_order", { ascending: true });

      if (fetchError) throw fetchError;

      const transformedProducts: LeadProduct[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        price: parseFloat(row.price) || 0,
        minQuantity: row.min_quantity || 1,
        expectedConversion: row.expected_conversion ? parseFloat(row.expected_conversion) : null,
        badge: row.badge,
        status: row.status || "active",
        displayOrder: row.display_order || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setProducts(transformedProducts);
    } catch (err) {
      console.error("Error fetching lead products:", err);
      setError(err instanceof Error ? err.message : "Failed to load lead products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const activeProducts = products.filter((p) => p.status === "active");

  const addProduct = async (product: Partial<LeadProduct>) => {
    const { error: insertError } = await supabase.from("lead_products").insert({
      name: product.name,
      category: product.category,
      price: product.price,
      min_quantity: product.minQuantity || 1,
      expected_conversion: product.expectedConversion,
      badge: product.badge,
      status: product.status || "active",
      display_order: product.displayOrder || products.length,
    });

    if (insertError) {
      toast({ title: "Error", description: insertError.message, variant: "destructive" });
      throw insertError;
    }

    toast({ title: "Success", description: "Lead product added" });
    await fetchProducts();
  };

  const updateProduct = async (id: string, product: Partial<LeadProduct>) => {
    const { error: updateError } = await supabase
      .from("lead_products")
      .update({
        name: product.name,
        category: product.category,
        price: product.price,
        min_quantity: product.minQuantity,
        expected_conversion: product.expectedConversion,
        badge: product.badge,
        status: product.status,
        display_order: product.displayOrder,
      })
      .eq("id", id);

    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
      throw updateError;
    }

    toast({ title: "Updated", description: "Lead product updated" });
    await fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    const { error: deleteError } = await supabase
      .from("lead_products")
      .delete()
      .eq("id", id);

    if (deleteError) {
      toast({ title: "Error", description: deleteError.message, variant: "destructive" });
      throw deleteError;
    }

    toast({ title: "Deleted", description: "Lead product removed" });
    await fetchProducts();
  };

  return {
    products,
    activeProducts,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts,
  };
};
