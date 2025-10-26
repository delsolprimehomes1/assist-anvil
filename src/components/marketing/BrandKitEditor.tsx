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
import { useBrandKit, BrandKit } from "@/hooks/useBrandKit";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

const brandKitSchema = z.object({
  company_name: z.string().min(1, "Company name is required").max(100),
  tagline: z.string().max(200).optional(),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
  primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  secondary_color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  accent_color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  text_color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
});

type BrandKitForm = z.infer<typeof brandKitSchema>;

interface BrandKitEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandKit?: BrandKit | null;
}

export const BrandKitEditor = ({ open, onOpenChange, brandKit }: BrandKitEditorProps) => {
  const { createBrandKit, updateBrandKit, uploadLogo } = useBrandKit();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(brandKit?.logo_url || null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BrandKitForm>({
    resolver: zodResolver(brandKitSchema),
    defaultValues: {
      company_name: brandKit?.company_name || "",
      tagline: brandKit?.tagline || "",
      website: brandKit?.website || "",
      phone: brandKit?.phone || "",
      email: brandKit?.email || "",
      primary_color: brandKit?.primary_color || "#3b82f6",
      secondary_color: brandKit?.secondary_color || "#8b5cf6",
      accent_color: brandKit?.accent_color || "#06b6d4",
      text_color: brandKit?.text_color || "#1e293b",
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo must be less than 2MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: BrandKitForm) => {
    try {
      let logo_url = brandKit?.logo_url || null;

      if (logoFile) {
        setIsUploading(true);
        logo_url = await uploadLogo(logoFile);
        setIsUploading(false);
      }

      const brandKitData = {
        company_name: data.company_name,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        accent_color: data.accent_color,
        text_color: data.text_color,
        logo_url,
        tagline: data.tagline || null,
        website: data.website || null,
        phone: data.phone || null,
        email: data.email || null,
      };

      if (brandKit) {
        await updateBrandKit.mutateAsync(brandKitData);
      } else {
        await createBrandKit.mutateAsync(brandKitData);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving brand kit:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{brandKit ? "Edit" : "Create"} Brand Kit</DialogTitle>
          <DialogDescription>
            Set up your company branding for personalized marketing materials
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Company Information</h3>
            
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input id="company_name" {...register("company_name")} />
              {errors.company_name && (
                <p className="text-sm text-destructive mt-1">{errors.company_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" {...register("tagline")} placeholder="Your company slogan" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} />
              </div>
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" {...register("website")} placeholder="https://example.com" />
              {errors.website && (
                <p className="text-sm text-destructive mt-1">{errors.website.message}</p>
              )}
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-4">
            <h3 className="font-semibold">Logo</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  id="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleLogoChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, or SVG (max 2MB)
                </p>
              </div>
              {logoPreview && (
                <div className="w-20 h-20 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          </div>

          {/* Color Palette */}
          <div className="space-y-4">
            <h3 className="font-semibold">Color Palette</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="primary_color">Primary</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    {...register("primary_color")}
                    className="h-10 w-full cursor-pointer"
                  />
                </div>
                {errors.primary_color && (
                  <p className="text-xs text-destructive mt-1">{errors.primary_color.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="secondary_color">Secondary</Label>
                <Input
                  id="secondary_color"
                  type="color"
                  {...register("secondary_color")}
                  className="h-10 w-full cursor-pointer"
                />
                {errors.secondary_color && (
                  <p className="text-xs text-destructive mt-1">{errors.secondary_color.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="accent_color">Accent</Label>
                <Input
                  id="accent_color"
                  type="color"
                  {...register("accent_color")}
                  className="h-10 w-full cursor-pointer"
                />
                {errors.accent_color && (
                  <p className="text-xs text-destructive mt-1">{errors.accent_color.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="text_color">Text</Label>
                <Input
                  id="text_color"
                  type="color"
                  {...register("text_color")}
                  className="h-10 w-full cursor-pointer"
                />
                {errors.text_color && (
                  <p className="text-xs text-destructive mt-1">{errors.text_color.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {brandKit ? "Update" : "Create"} Brand Kit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
