import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCreateCarrierNews, useUpdateCarrierNews, CarrierNews } from "@/hooks/useCarrierNews";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NewsFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  news?: CarrierNews;
}

export const NewsFormDialog = ({ open, onOpenChange, news }: NewsFormDialogProps) => {
  const [archiveDate, setArchiveDate] = useState<Date | undefined>(
    news?.archive_date ? new Date(news.archive_date) : undefined
  );
  const [tags, setTags] = useState<string>(news?.tags?.join(", ") || "");
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      title: news?.title || "",
      content: news?.content || "",
      news_type: news?.news_type || "general",
      carrier_id: news?.carrier_id || "",
      carrier_name: news?.carrier_name || "",
      priority: news?.priority || "normal",
      status: news?.status || "draft",
      attachment_url: news?.attachment_url || "",
    },
  });

  const createNews = useCreateCarrierNews();
  const updateNews = useUpdateCarrierNews();

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("carrier-news-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("carrier-news-attachments")
        .getPublicUrl(filePath);

      setValue("attachment_url", data.publicUrl);
      toast.success("File uploaded successfully");
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: any) => {
    const newsData = {
      ...data,
      carrier_name: data.carrier_id
        ? carriers?.find((c) => c.id === data.carrier_id)?.name
        : null,
      archive_date: archiveDate ? archiveDate.toISOString() : null,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
    };

    if (news) {
      await updateNews.mutateAsync({ id: news.id, ...newsData });
    } else {
      await createNews.mutateAsync(newsData);
    }

    onOpenChange(false);
  };

  const setArchivePreset = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setArchiveDate(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{news ? "Edit News" : "Create News"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title", { required: true })}
              placeholder="Enter news title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              {...register("content", { required: true })}
              placeholder="Enter full news content"
              rows={6}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="news_type">News Type *</Label>
              <Select
                value={watch("news_type")}
                onValueChange={(value) => setValue("news_type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="state_approval">State Approval</SelectItem>
                  <SelectItem value="product_update">Product Update</SelectItem>
                  <SelectItem value="new_product">New Product</SelectItem>
                  <SelectItem value="rate_change">Rate Change</SelectItem>
                  <SelectItem value="underwriting_change">Underwriting Update</SelectItem>
                  <SelectItem value="general">General News</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier (Optional)</Label>
              <Select
                value={watch("carrier_id") || "none"}
                onValueChange={(value) => setValue("carrier_id", value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {carriers?.map((carrier) => (
                    <SelectItem key={carrier.id} value={carrier.id}>
                      {carrier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={watch("priority")}
                onValueChange={(value) => setValue("priority", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Archive Date (Optional)</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !archiveDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {archiveDate ? format(archiveDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={archiveDate}
                    onSelect={setArchiveDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button type="button" variant="outline" size="sm" onClick={() => setArchivePreset(7)}>
                7 days
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setArchivePreset(30)}>
                30 days
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setArchivePreset(90)}>
                90 days
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setArchiveDate(undefined)}>
                Never
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="IUL, California, Final Expense"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachment">Attachment (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="attachment"
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                accept=".pdf,.doc,.docx,.xlsx,.xls"
              />
              {uploading && <Upload className="h-4 w-4 animate-spin" />}
            </div>
            {watch("attachment_url") && (
              <p className="text-sm text-muted-foreground">File uploaded</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createNews.isPending || updateNews.isPending}>
              {news ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
