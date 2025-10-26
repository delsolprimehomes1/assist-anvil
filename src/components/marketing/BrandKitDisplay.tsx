import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandKit } from "@/hooks/useBrandKit";
import { Building2, Globe, Mail, Phone, Edit, Copy } from "lucide-react";
import { toast } from "sonner";

interface BrandKitDisplayProps {
  brandKit: BrandKit;
  onEdit: () => void;
}

export const BrandKitDisplay = ({ brandKit, onEdit }: BrandKitDisplayProps) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Your Brand Kit</CardTitle>
            <CardDescription>Your personalized branding and marketing materials</CardDescription>
          </div>
          <Button onClick={onEdit} size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Info */}
        <div className="flex items-start gap-4">
          {brandKit.logo_url && (
            <div className="w-24 h-24 border rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
              <img
                src={brandKit.logo_url}
                alt={brandKit.company_name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <h3 className="text-2xl font-bold">{brandKit.company_name}</h3>
            {brandKit.tagline && (
              <p className="text-muted-foreground italic">{brandKit.tagline}</p>
            )}
            <div className="flex flex-wrap gap-3 text-sm">
              {brandKit.website && (
                <a
                  href={brandKit.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  {brandKit.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              {brandKit.email && (
                <a
                  href={`mailto:${brandKit.email}`}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {brandKit.email}
                </a>
              )}
              {brandKit.phone && (
                <a
                  href={`tel:${brandKit.phone}`}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {brandKit.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="space-y-3">
          <h4 className="font-semibold">Color Palette</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Primary", color: brandKit.primary_color },
              { label: "Secondary", color: brandKit.secondary_color },
              { label: "Accent", color: brandKit.accent_color },
              { label: "Text", color: brandKit.text_color },
            ].map(({ label, color }) => (
              <div key={label} className="space-y-2">
                <div
                  className="h-16 rounded-lg border-2 cursor-pointer transition-transform hover:scale-105"
                  style={{ backgroundColor: color }}
                  onClick={() => copyToClipboard(color, label)}
                  title="Click to copy"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{label}</span>
                  <button
                    onClick={() => copyToClipboard(color, label)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    {color.toUpperCase()}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
