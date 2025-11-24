import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, FileText } from "lucide-react";
import { CarrierNews } from "@/hooks/useCarrierNews";
import { formatDistanceToNow } from "date-fns";

interface NewsCardProps {
  news: CarrierNews;
  onReadMore: () => void;
}

const newsTypeConfig = {
  state_approval: { label: "State Approval", color: "bg-primary/10 text-primary border border-primary/30" },
  product_update: { label: "Product Update", color: "bg-gold/10 text-gold border border-gold/30" },
  new_product: { label: "New Product", color: "border-transparent bg-gradient-to-r from-gold to-gold/80 text-white" },
  rate_change: { label: "Rate Change", color: "bg-warning/10 text-warning border border-warning/30" },
  underwriting_change: { label: "Underwriting Update", color: "bg-primary/10 text-primary border border-primary/30" },
  general: { label: "General News", color: "bg-muted text-muted-foreground border-border" },
};

export const NewsCard = ({ news, onReadMore }: NewsCardProps) => {
  const typeConfig = newsTypeConfig[news.news_type];
  const isHighPriority = news.priority === "high";

  return (
    <Card 
      className={`brand-card-teal group ${isHighPriority ? 'border-l-4 border-l-gold' : ''}`}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className={typeConfig.color}>
            {typeConfig.label}
          </Badge>
          {isHighPriority && (
            <Badge variant="destructive" className="animate-pulse">
              Important
            </Badge>
          )}
        </div>
        
        <h3 className="text-xl font-semibold leading-tight group-hover:text-primary transition-colors">
          {news.title}
        </h3>

        {news.carrier_name && (
          <p className="text-sm text-muted-foreground font-medium">
            {news.carrier_name}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-muted-foreground line-clamp-3">
          {news.content.substring(0, 200)}...
        </p>

        {news.tags && news.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {news.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDistanceToNow(new Date(news.published_date), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span>{news.views_count}</span>
            </div>
            {news.attachment_url && (
              <FileText className="h-3.5 w-3.5" />
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReadMore}
            className="text-primary hover:text-primary"
          >
            Read More →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
