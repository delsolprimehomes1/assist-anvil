import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, Download, ExternalLink } from "lucide-react";
import { CarrierNews } from "@/hooks/useCarrierNews";
import { format } from "date-fns";
import { useEffect } from "react";
import { useIncrementNewsViews } from "@/hooks/useCarrierNews";

interface NewsDetailModalProps {
  news: CarrierNews | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const newsTypeConfig = {
  state_approval: { label: "State Approval", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  product_update: { label: "Product Update", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  new_product: { label: "New Product", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  rate_change: { label: "Rate Change", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  underwriting_change: { label: "Underwriting Update", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  general: { label: "General News", color: "bg-muted text-muted-foreground border-border" },
};

export const NewsDetailModal = ({ news, open, onOpenChange }: NewsDetailModalProps) => {
  const incrementViews = useIncrementNewsViews();

  useEffect(() => {
    if (open && news) {
      incrementViews.mutate(news.id);
    }
  }, [open, news?.id]);

  if (!news) return null;

  const typeConfig = newsTypeConfig[news.news_type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-2 flex-wrap">
              <Badge variant="outline" className={typeConfig.color}>
                {typeConfig.label}
              </Badge>
              {news.priority === "high" && (
                <Badge variant="destructive">Important</Badge>
              )}
            </div>

            <DialogTitle className="text-2xl leading-tight">
              {news.title}
            </DialogTitle>

            {news.carrier_name && (
              <p className="text-sm text-muted-foreground font-medium">
                {news.carrier_name}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(news.published_date), "MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span>{news.views_count} views</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-foreground">{news.content}</p>
          </div>

          {news.tags && news.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {news.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {news.attachment_url && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Attachments</h4>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={news.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Attachment
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          )}

          {news.archive_date && (
            <div className="text-sm text-muted-foreground pt-4 border-t">
              This news will be archived on {format(new Date(news.archive_date), "MMMM d, yyyy")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
