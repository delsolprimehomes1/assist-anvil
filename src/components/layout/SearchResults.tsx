import { useNavigate } from "react-router-dom";
import { Building2, Newspaper, GraduationCap, FileText, Loader2 } from "lucide-react";
import { SearchResults as SearchResultsType, SearchResult } from "@/hooks/useGlobalSearch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, highlightText } from "@/lib/utils";

interface SearchResultsProps {
  results: SearchResultsType;
  query: string;
  onResultClick: () => void;
}

export const SearchResults = ({ results, query, onResultClick }: SearchResultsProps) => {
  const navigate = useNavigate();

  const handleResultClick = (result: SearchResult) => {
    onResultClick();

    switch (result.category) {
      case "carrier":
        navigate("/carriers");
        break;
      case "news":
        navigate("/news");
        break;
      case "training":
        navigate(`/training/${result.id}`);
        break;
      case "guide":
        if (result.metadata?.url) {
          const link = document.createElement("a");
          link.href = result.metadata.url;
          link.download = result.title;
          link.click();
        }
        break;
    }
  };

  const getCategoryIcon = (category: SearchResult["category"]) => {
    switch (category) {
      case "carrier":
        return <Building2 className="h-4 w-4" />;
      case "news":
        return <Newspaper className="h-4 w-4" />;
      case "training":
        return <GraduationCap className="h-4 w-4" />;
      case "guide":
        return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: SearchResult["category"]) => {
    switch (category) {
      case "carrier":
        return "Carriers";
      case "news":
        return "News";
      case "training":
        return "Training";
      case "guide":
        return "Quick Guides";
    }
  };

  const renderResultGroup = (
    title: string,
    icon: React.ReactNode,
    resultsList: SearchResult[]
  ) => {
    if (resultsList.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground">
          {icon}
          <span>{title}</span>
          <Badge variant="secondary" className="ml-auto">
            {resultsList.length}
          </Badge>
        </div>
        <div className="space-y-1">
          {resultsList.map((result) => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result)}
              className={cn(
                "w-full flex items-start gap-3 px-3 py-2.5 text-left",
                "hover:bg-accent rounded-md transition-colors",
                "focus:bg-accent focus:outline-none"
              )}
            >
              <div className="mt-0.5 text-muted-foreground">
                {getCategoryIcon(result.category)}
              </div>
              <div className="flex-1 min-w-0">
                <div 
                  className="font-medium text-sm mb-0.5"
                  dangerouslySetInnerHTML={{ __html: highlightText(result.title, query) }}
                />
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {result.description}
                </div>
                {result.metadata?.carrierName && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {result.metadata.carrierName}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const totalResults =
    results.carriers.length +
    results.news.length +
    results.trainings.length +
    results.guides.length;

  if (results.isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg p-8 z-50">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Searching...</span>
        </div>
      </div>
    );
  }

  if (!query || query.length < 2) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg p-8 z-50">
        <div className="text-center text-muted-foreground">
          <div className="text-sm">Start typing to search carriers, news, training, and guides...</div>
        </div>
      </div>
    );
  }

  if (totalResults === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg p-8 z-50">
        <div className="text-center text-muted-foreground">
          <div className="text-sm font-medium mb-1">No results found</div>
          <div className="text-xs">Try searching with different keywords</div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
      <ScrollArea className="max-h-[400px]">
        <div className="p-2">
          {renderResultGroup("Carriers", <Building2 className="h-4 w-4" />, results.carriers)}
          {renderResultGroup("News", <Newspaper className="h-4 w-4" />, results.news)}
          {renderResultGroup("Training", <GraduationCap className="h-4 w-4" />, results.trainings)}
          {renderResultGroup("Quick Guides", <FileText className="h-4 w-4" />, results.guides)}
        </div>
      </ScrollArea>
      <div className="border-t px-3 py-2 text-xs text-muted-foreground bg-muted/30">
        Found {totalResults} result{totalResults !== 1 ? "s" : ""}
      </div>
    </div>
  );
};
