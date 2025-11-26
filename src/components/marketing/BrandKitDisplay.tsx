import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandKit } from "@/hooks/useBrandKit";
import { Building2, Globe, Mail, Phone, Edit, Copy, MapPin, Linkedin, Facebook, Instagram, User } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/tools/shared/GlassCard";
import { EmailSignatureGenerator } from "./EmailSignatureGenerator";

interface BrandKitDisplayProps {
  brandKit: BrandKit;
  onEdit: () => void;
}

export const BrandKitDisplay = ({ brandKit, onEdit }: BrandKitDisplayProps) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const hasAddress = brandKit.address_line1 || brandKit.city || brandKit.state || brandKit.zip_code;
  const hasSocialMedia = brandKit.linkedin_url || brandKit.facebook_url || brandKit.instagram_url;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <GlassCard>
        <div className="flex items-start justify-between mb-6">
          <div>
            <CardTitle className="text-2xl">Your Brand Kit</CardTitle>
            <CardDescription>Your personalized branding and marketing assets</CardDescription>
          </div>
          <Button onClick={onEdit} size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Logo and Company Info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-start gap-4">
              {brandKit.logo_url && (
                <div className="w-32 h-32 border border-border rounded-lg overflow-hidden bg-background flex items-center justify-center flex-shrink-0 p-3">
                  <img
                    src={brandKit.logo_url}
                    alt={brandKit.company_name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              {brandKit.secondary_logo_url && (
                <div className="w-24 h-24 border border-border rounded-lg overflow-hidden bg-background flex items-center justify-center flex-shrink-0 p-2">
                  <img
                    src={brandKit.secondary_logo_url}
                    alt="Icon"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>
            
            <div>
              <h3 
                className="text-3xl font-bold mb-2"
                style={{ fontFamily: brandKit.font_heading }}
              >
                {brandKit.company_name}
              </h3>
              {brandKit.tagline && (
                <p 
                  className="text-muted-foreground italic text-lg mb-3"
                  style={{ fontFamily: brandKit.font_body }}
                >
                  {brandKit.tagline}
                </p>
              )}
              {brandKit.credentials_display && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {brandKit.credentials_display}
                </p>
              )}
            </div>
          </div>

          {/* Agent Photo */}
          {brandKit.agent_photo_url && (
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
                <img
                  src={brandKit.agent_photo_url}
                  alt="Agent"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Brand Voice */}
        {brandKit.brand_voice && (
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Brand Voice</h4>
            <p className="text-foreground" style={{ fontFamily: brandKit.font_body }}>
              {brandKit.brand_voice}
            </p>
          </div>
        )}
      </GlassCard>

      {/* Color Palette */}
      <GlassCard>
        <h4 className="font-semibold text-lg mb-4">Color Palette</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Primary", color: brandKit.primary_color },
            { label: "Secondary", color: brandKit.secondary_color },
            { label: "Accent", color: brandKit.accent_color },
            { label: "Text", color: brandKit.text_color },
          ].map(({ label, color }) => (
            <div key={label} className="space-y-2">
              <div
                className="h-24 rounded-lg border-2 border-border cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
                style={{ backgroundColor: color }}
                onClick={() => copyToClipboard(color, label)}
                title="Click to copy"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                <button
                  onClick={() => copyToClipboard(color, label)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  {color.toUpperCase()}
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Typography */}
      <GlassCard>
        <h4 className="font-semibold text-lg mb-4">Typography</h4>
        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4 bg-background">
            <p className="text-xs text-muted-foreground mb-2">Heading Font</p>
            <h3 
              className="text-2xl font-bold"
              style={{ fontFamily: brandKit.font_heading }}
            >
              {brandKit.font_heading}
            </h3>
          </div>
          <div className="border border-border rounded-lg p-4 bg-background">
            <p className="text-xs text-muted-foreground mb-2">Body Font</p>
            <p 
              className="text-base"
              style={{ fontFamily: brandKit.font_body }}
            >
              {brandKit.font_body} - The quick brown fox jumps over the lazy dog
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Contact Information */}
      <GlassCard>
        <h4 className="font-semibold text-lg mb-4">Contact Information</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {brandKit.email && (
              <a
                href={`mailto:${brandKit.email}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <Mail className="h-5 w-5 text-primary" />
                <span className="text-sm">{brandKit.email}</span>
              </a>
            )}
            {brandKit.phone && (
              <a
                href={`tel:${brandKit.phone}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-sm">{brandKit.phone}</span>
              </a>
            )}
            {brandKit.website && (
              <a
                href={brandKit.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <Globe className="h-5 w-5 text-primary" />
                <span className="text-sm">{brandKit.website.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
          </div>

          {hasAddress && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm space-y-1">
                {brandKit.address_line1 && <p>{brandKit.address_line1}</p>}
                {brandKit.address_line2 && <p>{brandKit.address_line2}</p>}
                {(brandKit.city || brandKit.state || brandKit.zip_code) && (
                  <p>
                    {[brandKit.city, brandKit.state, brandKit.zip_code].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Social Media */}
        {hasSocialMedia && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm font-medium mb-3">Social Media</p>
            <div className="flex gap-3">
              {brandKit.linkedin_url && (
                <a
                  href={brandKit.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                >
                  <Linkedin className="h-5 w-5 text-primary" />
                </a>
              )}
              {brandKit.facebook_url && (
                <a
                  href={brandKit.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                >
                  <Facebook className="h-5 w-5 text-primary" />
                </a>
              )}
              {brandKit.instagram_url && (
                <a
                  href={brandKit.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                >
                  <Instagram className="h-5 w-5 text-primary" />
                </a>
              )}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Email Signature Generator */}
      <EmailSignatureGenerator brandKit={brandKit} />
    </div>
  );
};
