import { useState } from "react";
import { Newspaper } from "lucide-react";
import { useCarrierNews } from "@/hooks/useCarrierNews";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NewsCard } from "@/components/news/NewsCard";
import { NewsDetailModal } from "@/components/news/NewsDetailModal";
import { NewsFilters } from "@/components/news/NewsFilters";
import { CarrierNews } from "@/hooks/useCarrierNews";

const News = () => {
  const [selectedNews, setSelectedNews] = useState<CarrierNews | null>(null);
  const [search, setSearch] = useState("");
  const [newsType, setNewsType] = useState("all");
  const [carrierId, setCarrierId] = useState("all");
  const [includeArchived, setIncludeArchived] = useState(false);

  const filters = {
    search: search || undefined,
    newsType: newsType !== "all" ? (newsType as any) : undefined,
    carrierId: carrierId !== "all" ? carrierId : undefined,
    includeArchived,
  };

  const { data: news, isLoading } = useCarrierNews(filters);
  
  const { data: carriers } = useQuery({
    queryKey: ["carriers-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carriers")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
  });

  const highPriorityNews = news?.filter((n) => n.priority === "high") || [];
  const normalNews = news?.filter((n) => n.priority !== "high") || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Newspaper className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Carrier News & Updates</h1>
              <p className="text-muted-foreground mt-1">
                Stay informed about the latest carrier announcements and updates
              </p>
            </div>
          </div>
        </div>

        <NewsFilters
          search={search}
          onSearchChange={setSearch}
          newsType={newsType}
          onNewsTypeChange={setNewsType}
          carrierId={carrierId}
          onCarrierIdChange={setCarrierId}
          includeArchived={includeArchived}
          onIncludeArchivedChange={setIncludeArchived}
          carriers={carriers || []}
        />

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : news && news.length > 0 ? (
          <div className="space-y-8">
            {highPriorityNews.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <span className="text-primary">⭐</span> High Priority
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {highPriorityNews.map((newsItem) => (
                    <NewsCard
                      key={newsItem.id}
                      news={newsItem}
                      onReadMore={() => setSelectedNews(newsItem)}
                    />
                  ))}
                </div>
              </div>
            )}

            {normalNews.length > 0 && (
              <div className="space-y-4">
                {highPriorityNews.length > 0 && (
                  <h2 className="text-2xl font-semibold">Recent Updates</h2>
                )}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {normalNews.map((newsItem) => (
                    <NewsCard
                      key={newsItem.id}
                      news={newsItem}
                      onReadMore={() => setSelectedNews(newsItem)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Newspaper className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No news to display</h3>
            <p className="text-muted-foreground">
              Check back soon for carrier updates and announcements
            </p>
          </div>
        )}

        <NewsDetailModal
          news={selectedNews}
          open={!!selectedNews}
          onOpenChange={(open) => !open && setSelectedNews(null)}
        />
      </div>
    </div>
  );
};

export default News;
