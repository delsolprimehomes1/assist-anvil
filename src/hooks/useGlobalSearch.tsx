import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: "carrier" | "news" | "training" | "guide" | "tool";
  metadata?: {
    carrierName?: string;
    logoUrl?: string;
    url?: string;
    tags?: string[];
    toolCategory?: string;
  };
}

export interface SearchResults {
  carriers: SearchResult[];
  news: SearchResult[];
  trainings: SearchResult[];
  guides: SearchResult[];
  tools: SearchResult[];
  isLoading: boolean;
}

const allTools = [
  { id: "debt-vs-investing", title: "Debt vs Investing", description: "Should I pay debt or invest?", category: "cashflow" },
  { id: "inflation-retirement", title: "Inflation Retirement", description: "How does inflation change retirement?", category: "cashflow" },
  { id: "purchasing-power", title: "Purchasing Power", description: "How inflation eats your money", category: "cashflow" },
  { id: "social-security", title: "Social Security", description: "Estimate my Social Security income", category: "retirement" },
  { id: "inflation-damage", title: "Inflation Damage", description: "How inflation changes retirement", category: "retirement" },
  { id: "habits-wealth", title: "Habits → Wealth", description: "Turn spending into future wealth", category: "retirement" },
  { id: "life-expectancy", title: "Life Expectancy", description: "Estimate your life expectancy", category: "life" },
  { id: "lifetime-earnings", title: "Lifetime Earnings", description: "Calculate total career earnings", category: "life" },
  { id: "insurance-longevity", title: "Insurance Longevity", description: "How long will coverage last?", category: "life" },
  { id: "commission", title: "Commission Calculator", description: "Calculate agent commissions", category: "life" },
];

export const useGlobalSearch = (query: string) => {
  const [results, setResults] = useState<SearchResults>({
    carriers: [],
    news: [],
    trainings: [],
    guides: [],
    tools: [],
    isLoading: false,
  });

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({
        carriers: [],
        news: [],
        trainings: [],
        guides: [],
        tools: [],
        isLoading: false,
      });
      return;
    }

    const timeoutId = setTimeout(() => {
      searchAll(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const searchTools = (query: string): SearchResult[] => {
    const lowerQuery = query.toLowerCase();
    return allTools
      .filter(
        (tool) =>
          tool.title.toLowerCase().includes(lowerQuery) ||
          tool.description.toLowerCase().includes(lowerQuery)
      )
      .map((tool) => ({
        id: tool.id,
        title: tool.title,
        description: tool.description,
        category: "tool" as const,
        metadata: {
          toolCategory: tool.category,
        },
      }))
      .slice(0, 5);
  };

  const searchAll = async (searchQuery: string) => {
    setResults((prev) => ({ ...prev, isLoading: true }));

    try {
      const [carriersData, newsData, trainingsData, guidesData] = await Promise.all([
        searchCarriers(searchQuery),
        searchNews(searchQuery),
        searchTrainings(searchQuery),
        searchGuides(searchQuery),
      ]);

      const toolsData = searchTools(searchQuery);

      setResults({
        carriers: carriersData,
        news: newsData,
        trainings: trainingsData,
        guides: guidesData,
        tools: toolsData,
        isLoading: false,
      });
    } catch (error) {
      console.error("Search error:", error);
      setResults({
        carriers: [],
        news: [],
        trainings: [],
        guides: [],
        tools: [],
        isLoading: false,
      });
    }
  };

  const searchCarriers = async (query: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from("carriers")
      .select("id, name, description, products, logo_url")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(3);

    if (error || !data) return [];

    return data.map((carrier) => ({
      id: carrier.id,
      title: carrier.name,
      description: carrier.description || "Insurance carrier",
      category: "carrier" as const,
      metadata: {
        logoUrl: carrier.logo_url || undefined,
      },
    }));
  };

  const searchNews = async (query: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from("carrier_news")
      .select("id, title, content, carrier_name")
      .eq("status", "published")
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(3);

    if (error || !data) return [];

    return data.map((news) => ({
      id: news.id,
      title: news.title,
      description: news.content.substring(0, 100) + "...",
      category: "news" as const,
      metadata: {
        carrierName: news.carrier_name || undefined,
      },
    }));
  };

  const searchTrainings = async (query: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from("trainings")
      .select("id, title, description, tags")
      .eq("status", "published")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(3);

    if (error || !data) return [];

    return data.map((training) => ({
      id: training.id,
      title: training.title,
      description: training.description.substring(0, 100) + "...",
      category: "training" as const,
      metadata: {
        tags: training.tags || [],
      },
    }));
  };

  const searchGuides = async (query: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from("carriers")
      .select("id, name, logo_url, pdf_documents")
      .not("pdf_documents", "is", null)
      .or(`name.ilike.%${query}%`)
      .limit(10);

    if (error || !data) return [];

    const guides: SearchResult[] = [];
    
    data.forEach((carrier) => {
      const docs = carrier.pdf_documents as any;
      if (Array.isArray(docs)) {
        docs.forEach((doc: any) => {
          if (doc.title?.toLowerCase().includes(query.toLowerCase())) {
            guides.push({
              id: `${carrier.id}-${doc.title}`,
              title: doc.title,
              description: `${carrier.name} - Quick Guide`,
              category: "guide" as const,
              metadata: {
                carrierName: carrier.name,
                logoUrl: carrier.logo_url || undefined,
                url: doc.url,
              },
            });
          }
        });
      }
    });

    return guides.slice(0, 3);
  };

  return results;
};
