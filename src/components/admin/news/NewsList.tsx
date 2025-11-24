import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Archive } from "lucide-react";
import { CarrierNews, useDeleteCarrierNews, useUpdateCarrierNews } from "@/hooks/useCarrierNews";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface NewsListProps {
  news: CarrierNews[];
  onEdit: (news: CarrierNews) => void;
}

const newsTypeConfig = {
  state_approval: { label: "State Approval", color: "bg-blue-500/10 text-blue-600" },
  product_update: { label: "Product Update", color: "bg-purple-500/10 text-purple-600" },
  new_product: { label: "New Product", color: "bg-green-500/10 text-green-600" },
  rate_change: { label: "Rate Change", color: "bg-orange-500/10 text-orange-600" },
  underwriting_change: { label: "Underwriting", color: "bg-yellow-500/10 text-yellow-600" },
  general: { label: "General", color: "bg-muted text-muted-foreground" },
};

export const NewsList = ({ news, onEdit }: NewsListProps) => {
  const deleteNews = useDeleteCarrierNews();
  const updateNews = useUpdateCarrierNews();

  const handleArchive = async (newsItem: CarrierNews) => {
    await updateNews.mutateAsync({
      id: newsItem.id,
      status: "archived",
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Carrier</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Views</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {news.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No news items found
              </TableCell>
            </TableRow>
          ) : (
            news.map((newsItem) => {
              const typeConfig = newsTypeConfig[newsItem.news_type];
              return (
                <TableRow key={newsItem.id}>
                  <TableCell className="font-medium">{newsItem.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={typeConfig.color}>
                      {typeConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{newsItem.carrier_name || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={newsItem.priority === "high" ? "destructive" : "secondary"}
                    >
                      {newsItem.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{newsItem.views_count}</TableCell>
                  <TableCell>
                    {format(new Date(newsItem.published_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(newsItem)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {newsItem.status === "published" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Archive className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Archive News</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to archive this news item?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleArchive(newsItem)}>
                                Archive
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete News</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this news item? This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteNews.mutate(newsItem.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
