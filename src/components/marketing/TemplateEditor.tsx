import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useMarketingTemplates, MarketingTemplate } from "@/hooks/useMarketingTemplates";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const templateSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  type: z.enum(["canva_template", "email_script", "sms_script", "brand_asset"]),
  description: z.string().min(1, "Description is required").max(500),
  content: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
  tags: z.string().optional(),
});

type TemplateForm = z.infer<typeof templateSchema>;

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: MarketingTemplate | null;
}

export const TemplateEditor = ({ open, onOpenChange, template }: TemplateEditorProps) => {
  const { createTemplate, updateTemplate, uploadAsset } = useMarketingTemplates();
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: template?.title || "",
      type: template?.type || "canva_template",
      description: template?.description || "",
      content: template?.content || "",
      url: template?.url || "",
      tags: template?.tags?.join(", ") || "",
    },
  });

  const templateType = watch("type");

  const handleAssetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File must be less than 10MB");
        return;
      }
      setAssetFile(file);
    }
  };

  const onSubmit = async (data: TemplateForm) => {
    try {
      let file_url = template?.file_url || null;

      if (assetFile) {
        setIsUploading(true);
        file_url = await uploadAsset(assetFile);
        setIsUploading(false);
      }

      const templateData = {
        title: data.title,
        type: data.type,
        description: data.description,
        content: data.content || null,
        url: data.url || null,
        file_url,
        tags: data.tags ? data.tags.split(",").map((tag) => tag.trim()) : [],
      };

      if (template) {
        await updateTemplate.mutateAsync({ id: template.id, ...templateData });
      } else {
        await createTemplate.mutateAsync(templateData);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Edit" : "Create"} Template</DialogTitle>
          <DialogDescription>
            Add your custom marketing templates and resources
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...register("title")} />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="type">Type *</Label>
            <Select
              value={templateType}
              onValueChange={(value) => setValue("type", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="canva_template">Canva Template</SelectItem>
                <SelectItem value="email_script">Email Script</SelectItem>
                <SelectItem value="sms_script">SMS Script</SelectItem>
                <SelectItem value="brand_asset">Brand Asset</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" {...register("description")} rows={3} />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
            )}
          </div>

          {templateType === "canva_template" && (
            <div>
              <Label htmlFor="url">Canva Template URL</Label>
              <Input id="url" {...register("url")} placeholder="https://canva.com/..." />
              {errors.url && (
                <p className="text-sm text-destructive mt-1">{errors.url.message}</p>
              )}
            </div>
          )}

          {(templateType === "email_script" || templateType === "sms_script") && (
            <div>
              <Label htmlFor="content">Script Content</Label>
              <Textarea id="content" {...register("content")} rows={6} />
            </div>
          )}

          {templateType === "brand_asset" && (
            <div>
              <Label htmlFor="asset">Upload File</Label>
              <Input
                id="asset"
                type="file"
                onChange={handleAssetChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
            </div>
          )}

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              {...register("tags")}
              placeholder="marketing, email, follow-up"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {template ? "Update" : "Create"} Template
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
