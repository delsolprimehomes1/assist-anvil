import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminMarketingResources } from "@/hooks/useAdminMarketingResources";
import { Loader2, Upload } from "lucide-react";

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().min(1, "Description is required"),
  content: z.string().optional(),
  url: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  status: z.string().default("published"),
  display_order: z.number().default(0),
});

type ResourceForm = z.infer<typeof resourceSchema>;

interface MarketingResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: any;
}

export const MarketingResourceFormDialog = ({
  open,
  onOpenChange,
  resource,
}: MarketingResourceFormDialogProps) => {
  const { createResource, updateResource, uploadFile } = useAdminMarketingResources();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const form = useForm<ResourceForm>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      type: "canva_template",
      description: "",
      content: "",
      url: "",
      category: "",
      tags: "",
      status: "published",
      display_order: 0,
    },
  });

  useEffect(() => {
    if (resource) {
      form.reset({
        title: resource.title,
        type: resource.type,
        description: resource.description,
        content: resource.content || "",
        url: resource.url || "",
        category: resource.category || "",
        tags: resource.tags?.join(", ") || "",
        status: resource.status,
        display_order: resource.display_order,
      });
    } else {
      form.reset({
        title: "",
        type: "canva_template",
        description: "",
        content: "",
        url: "",
        category: "",
        tags: "",
        status: "published",
        display_order: 0,
      });
    }
  }, [resource, form]);

  const onSubmit = async (data: ResourceForm) => {
    try {
      setUploading(true);

      let fileUrl = resource?.file_url;
      let thumbnailUrl = resource?.thumbnail_url;

      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile, "files");
      }

      if (thumbnailFile) {
        thumbnailUrl = await uploadFile(thumbnailFile, "thumbnails");
      }

      const tags = data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

      const resourceData = {
        title: data.title,
        type: data.type,
        description: data.description,
        content: data.content || null,
        url: data.url || null,
        file_url: fileUrl || null,
        thumbnail_url: thumbnailUrl || null,
        category: data.category || null,
        tags,
        status: data.status,
        display_order: data.display_order,
      };

      if (resource) {
        await updateResource.mutateAsync({ id: resource.id, ...resourceData });
      } else {
        await createResource.mutateAsync(resourceData);
      }

      onOpenChange(false);
      setSelectedFile(null);
      setThumbnailFile(null);
    } catch (error) {
      console.error("Error saving resource:", error);
    } finally {
      setUploading(false);
    }
  };

  const selectedType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {resource ? "Edit Resource" : "Add Resource"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Resource title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="canva_template">Canva Template</SelectItem>
                      <SelectItem value="email_script">Email Script</SelectItem>
                      <SelectItem value="sms_script">SMS Script</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="brand_asset">Brand Asset</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Brief description" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedType.includes("script") && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Script Content</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter script text" rows={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedType === "canva_template" && (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canva URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://canva.com/..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(selectedType === "creative" || selectedType === "brand_asset") && (
              <div className="space-y-2">
                <FormLabel>Upload File</FormLabel>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {selectedFile && <Upload className="h-4 w-4 text-primary" />}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <FormLabel>Thumbnail (Optional)</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Social Media, Email Campaigns" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., insurance, lead gen, social" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="display_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {resource ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
