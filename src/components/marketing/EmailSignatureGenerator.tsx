import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/tools/shared/GlassCard";
import { BrandKit } from "@/hooks/useBrandKit";
import { Copy, Check, Mail } from "lucide-react";
import { toast } from "sonner";

interface EmailSignatureGeneratorProps {
  brandKit: BrandKit;
}

export const EmailSignatureGenerator = ({ brandKit }: EmailSignatureGeneratorProps) => {
  const [copied, setCopied] = useState(false);

  const generateSignatureHTML = () => {
    return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${brandKit.font_body}, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: ${brandKit.text_color};">
  <tr>
    <td style="padding-right: 20px; vertical-align: top;">
      ${brandKit.agent_photo_url ? `<img src="${brandKit.agent_photo_url}" alt="Profile" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;" />` : ''}
    </td>
    <td style="vertical-align: top;">
      <div style="font-family: ${brandKit.font_heading}, Arial, sans-serif; font-size: 18px; font-weight: bold; color: ${brandKit.primary_color}; margin-bottom: 4px;">
        ${brandKit.company_name}
      </div>
      ${brandKit.tagline ? `<div style="font-style: italic; color: ${brandKit.text_color}; opacity: 0.8; margin-bottom: 8px;">${brandKit.tagline}</div>` : ''}
      ${brandKit.credentials_display ? `<div style="font-size: 12px; color: ${brandKit.text_color}; opacity: 0.7; margin-bottom: 8px;">${brandKit.credentials_display}</div>` : ''}
      ${brandKit.email ? `<div style="margin-bottom: 4px;"><a href="mailto:${brandKit.email}" style="color: ${brandKit.primary_color}; text-decoration: none;">${brandKit.email}</a></div>` : ''}
      ${brandKit.phone ? `<div style="margin-bottom: 4px;"><a href="tel:${brandKit.phone}" style="color: ${brandKit.primary_color}; text-decoration: none;">${brandKit.phone}</a></div>` : ''}
      ${brandKit.website ? `<div style="margin-bottom: 8px;"><a href="${brandKit.website}" style="color: ${brandKit.primary_color}; text-decoration: none;">${brandKit.website.replace(/^https?:\/\//, '')}</a></div>` : ''}
      ${brandKit.address_line1 ? `
        <div style="font-size: 12px; color: ${brandKit.text_color}; opacity: 0.7; margin-top: 8px;">
          ${brandKit.address_line1}${brandKit.address_line2 ? `, ${brandKit.address_line2}` : ''}<br/>
          ${[brandKit.city, brandKit.state, brandKit.zip_code].filter(Boolean).join(', ')}
        </div>
      ` : ''}
      ${(brandKit.linkedin_url || brandKit.facebook_url || brandKit.instagram_url) ? `
        <div style="margin-top: 12px;">
          ${brandKit.linkedin_url ? `<a href="${brandKit.linkedin_url}" style="display: inline-block; margin-right: 8px;"><img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" width="20" height="20" /></a>` : ''}
          ${brandKit.facebook_url ? `<a href="${brandKit.facebook_url}" style="display: inline-block; margin-right: 8px;"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" width="20" height="20" /></a>` : ''}
          ${brandKit.instagram_url ? `<a href="${brandKit.instagram_url}" style="display: inline-block; margin-right: 8px;"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" width="20" height="20" /></a>` : ''}
        </div>
      ` : ''}
    </td>
  </tr>
</table>
    `.trim();
  };

  const copySignature = () => {
    const html = generateSignatureHTML();
    
    // Create a temporary element to copy HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    document.body.appendChild(tempElement);
    
    // Select the content
    const range = document.createRange();
    range.selectNode(tempElement);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    
    try {
      // Copy as HTML
      document.execCommand('copy');
      setCopied(true);
      toast.success("Email signature copied! Paste it in your email client's signature settings.");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy signature");
    } finally {
      document.body.removeChild(tempElement);
      window.getSelection()?.removeAllRanges();
    }
  };

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-lg">Email Signature</h4>
        </div>
        <Button onClick={copySignature} size="sm" variant="outline">
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy HTML
            </>
          )}
        </Button>
      </div>

      <div className="border border-border rounded-lg p-6 bg-background">
        <div className="flex gap-4">
          {brandKit.agent_photo_url && (
            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
              <img
                src={brandKit.agent_photo_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h5 
              className="text-lg font-bold mb-1" 
              style={{ 
                fontFamily: brandKit.font_heading,
                color: brandKit.primary_color 
              }}
            >
              {brandKit.company_name}
            </h5>
            {brandKit.tagline && (
              <p 
                className="text-sm italic mb-2 opacity-80"
                style={{ fontFamily: brandKit.font_body }}
              >
                {brandKit.tagline}
              </p>
            )}
            {brandKit.credentials_display && (
              <p className="text-xs opacity-70 mb-2">{brandKit.credentials_display}</p>
            )}
            <div className="space-y-1 text-sm" style={{ fontFamily: brandKit.font_body }}>
              {brandKit.email && (
                <p>
                  <a href={`mailto:${brandKit.email}`} style={{ color: brandKit.primary_color }}>
                    {brandKit.email}
                  </a>
                </p>
              )}
              {brandKit.phone && (
                <p>
                  <a href={`tel:${brandKit.phone}`} style={{ color: brandKit.primary_color }}>
                    {brandKit.phone}
                  </a>
                </p>
              )}
              {brandKit.website && (
                <p>
                  <a 
                    href={brandKit.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: brandKit.primary_color }}
                  >
                    {brandKit.website.replace(/^https?:\/\//, "")}
                  </a>
                </p>
              )}
              {brandKit.address_line1 && (
                <p className="text-xs opacity-70 mt-2">
                  {brandKit.address_line1}
                  {brandKit.address_line2 && `, ${brandKit.address_line2}`}
                  <br />
                  {[brandKit.city, brandKit.state, brandKit.zip_code].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Copy this signature and paste it into your email client's signature settings (Gmail, Outlook, etc.)
      </p>
    </GlassCard>
  );
};
