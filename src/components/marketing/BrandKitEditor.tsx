import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandKit, useBrandKit } from "@/hooks/useBrandKit";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Upload, Loader2, Building2, Palette, Type, MapPin, Eye } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const brandKitSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  tagline: z.string().optional(),
  brand_voice: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  facebook_url: z.string().url().optional().or(z.literal("")),
  instagram_url: z.string().url().optional().or(z.literal("")),
  credentials_display: z.string().optional(),
  primary_color: z.string(),
  secondary_color: z.string(),
  accent_color: z.string(),
  text_color: z.string(),
  font_heading: z.string(),
  font_body: z.string(),
});

type BrandKitForm = z.infer<typeof brandKitSchema>;

interface BrandKitEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandKit: BrandKit | null;
}

const FONT_OPTIONS = [
  "Inter", "Playfair Display", "Roboto", "Open Sans", "Lato", 
  "Montserrat", "Poppins", "Raleway", "Merriweather", "Source Sans Pro"
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", 
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", 
  "VA", "WA", "WV", "WI", "WY"
];

export const BrandKitEditor = ({ open, onOpenChange, brandKit }: BrandKitEditorProps) => {
  const { createBrandKit, updateBrandKit, uploadLogo, uploadAgentPhoto, uploadSecondaryLogo } = useBrandKit();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(brandKit?.logo_url || null);
  const [agentPhotoFile, setAgentPhotoFile] = useState<File | null>(null);
  const [agentPhotoPreview, setAgentPhotoPreview] = useState<string | null>(brandKit?.agent_photo_url || null);
  const [secondaryLogoFile, setSecondaryLogoFile] = useState<File | null>(null);
  const [secondaryLogoPreview, setSecondaryLogoPreview] = useState<string | null>(brandKit?.secondary_logo_url || null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<BrandKitForm>({
    resolver: zodResolver(brandKitSchema),
    defaultValues: {
      company_name: brandKit?.company_name || "",
      tagline: brandKit?.tagline || "",
      brand_voice: brandKit?.brand_voice || "",
      website: brandKit?.website || "",
      phone: brandKit?.phone || "",
      email: brandKit?.email || "",
      address_line1: brandKit?.address_line1 || "",
      address_line2: brandKit?.address_line2 || "",
      city: brandKit?.city || "",
      state: brandKit?.state || "",
      zip_code: brandKit?.zip_code || "",
      linkedin_url: brandKit?.linkedin_url || "",
      facebook_url: brandKit?.facebook_url || "",
      instagram_url: brandKit?.instagram_url || "",
      credentials_display: brandKit?.credentials_display || "",
      primary_color: brandKit?.primary_color || "#8BBAC4",
      secondary_color: brandKit?.secondary_color || "#C98A3A",
      accent_color: brandKit?.accent_color || "#06b6d4",
      text_color: brandKit?.text_color || "#1e293b",
      font_heading: brandKit?.font_heading || "Inter",
      font_body: brandKit?.font_body || "Inter",
    },
  });

  useEffect(() => {
    if (brandKit) {
      setLogoPreview(brandKit.logo_url);
      setAgentPhotoPreview(brandKit.agent_photo_url);
      setSecondaryLogoPreview(brandKit.secondary_logo_url);
    }
  }, [brandKit]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'agent' | 'secondary') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      
      if (type === 'logo') {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      } else if (type === 'agent') {
        setAgentPhotoFile(file);
        setAgentPhotoPreview(URL.createObjectURL(file));
      } else {
        setSecondaryLogoFile(file);
        setSecondaryLogoPreview(URL.createObjectURL(file));
      }
    }
  };

  const onSubmit = async (data: BrandKitForm) => {
    try {
      setIsUploading(true);
      let logoUrl = brandKit?.logo_url || null;
      let agentPhotoUrl = brandKit?.agent_photo_url || null;
      let secondaryLogoUrl = brandKit?.secondary_logo_url || null;

      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }
      if (agentPhotoFile) {
        agentPhotoUrl = await uploadAgentPhoto(agentPhotoFile);
      }
      if (secondaryLogoFile) {
        secondaryLogoUrl = await uploadSecondaryLogo(secondaryLogoFile);
      }

      const brandKitData = {
        company_name: data.company_name,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        accent_color: data.accent_color,
        text_color: data.text_color,
        logo_url: logoUrl,
        agent_photo_url: agentPhotoUrl,
        secondary_logo_url: secondaryLogoUrl,
        tagline: data.tagline || null,
        website: data.website || null,
        phone: data.phone || null,
        email: data.email || null,
        address_line1: data.address_line1 || null,
        address_line2: data.address_line2 || null,
        city: data.city || null,
        state: data.state || null,
        zip_code: data.zip_code || null,
        linkedin_url: data.linkedin_url || null,
        facebook_url: data.facebook_url || null,
        instagram_url: data.instagram_url || null,
        font_heading: data.font_heading,
        font_body: data.font_body,
        brand_voice: data.brand_voice || null,
        credentials_display: data.credentials_display || null,
      };

      if (brandKit) {
        await updateBrandKit.mutateAsync(brandKitData);
      } else {
        await createBrandKit.mutateAsync(brandKitData);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving brand kit:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {brandKit ? "Edit Brand Kit" : "Create Brand Kit"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="identity" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="identity" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Identity</span>
                </TabsTrigger>
                <TabsTrigger value="visual" className="gap-2">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Visual</span>
                </TabsTrigger>
                <TabsTrigger value="typography" className="gap-2">
                  <Type className="h-4 w-4" />
                  <span className="hidden sm:inline">Typography</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Contact</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Preview</span>
                </TabsTrigger>
              </TabsList>

              {/* Identity Tab */}
              <TabsContent value="identity" className="space-y-4">
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Company Identity</h3>
                  
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your Company Name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tagline</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your memorable tagline" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brand_voice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Voice</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Describe your brand's tone and personality (e.g., Professional and trustworthy with a warm, approachable touch)" 
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="credentials_display"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credentials Display</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Licensed Agent | NPN: 12345678" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Visual Tab */}
              <TabsContent value="visual" className="space-y-4">
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Logo Upload */}
                    <div className="space-y-3">
                      <Label>Company Logo</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'logo')}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label htmlFor="logo-upload" className="cursor-pointer block">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="max-h-32 mx-auto object-contain" />
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Upload Logo</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Agent Photo Upload */}
                    <div className="space-y-3">
                      <Label>Agent Photo</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'agent')}
                          className="hidden"
                          id="agent-photo-upload"
                        />
                        <label htmlFor="agent-photo-upload" className="cursor-pointer block">
                          {agentPhotoPreview ? (
                            <img src={agentPhotoPreview} alt="Agent" className="max-h-32 mx-auto object-cover rounded-full w-32 h-32" />
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Upload Photo</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Secondary Logo Upload */}
                    <div className="space-y-3">
                      <Label>Icon/Favicon</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'secondary')}
                          className="hidden"
                          id="secondary-logo-upload"
                        />
                        <label htmlFor="secondary-logo-upload" className="cursor-pointer block">
                          {secondaryLogoPreview ? (
                            <img src={secondaryLogoPreview} alt="Icon" className="max-h-32 mx-auto object-contain" />
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Upload Icon</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Color Palette</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="primary_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary</FormLabel>
                            <div className="flex gap-2">
                              <Input type="color" {...field} className="h-10 w-16 p-1" />
                              <Input {...field} placeholder="#8BBAC4" className="flex-1" />
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="secondary_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secondary</FormLabel>
                            <div className="flex gap-2">
                              <Input type="color" {...field} className="h-10 w-16 p-1" />
                              <Input {...field} placeholder="#C98A3A" className="flex-1" />
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="accent_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accent</FormLabel>
                            <div className="flex gap-2">
                              <Input type="color" {...field} className="h-10 w-16 p-1" />
                              <Input {...field} placeholder="#06b6d4" className="flex-1" />
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="text_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Text</FormLabel>
                            <div className="flex gap-2">
                              <Input type="color" {...field} className="h-10 w-16 p-1" />
                              <Input {...field} placeholder="#1e293b" className="flex-1" />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Typography Tab */}
              <TabsContent value="typography" className="space-y-4">
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-foreground">Typography</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="font_heading"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heading Font</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select heading font" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FONT_OPTIONS.map((font) => (
                                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                  {font}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="font_body"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Body Font</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select body font" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FONT_OPTIONS.map((font) => (
                                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                  {font}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border border-border rounded-lg p-6 space-y-4">
                    <p className="text-sm text-muted-foreground">Font Preview:</p>
                    <h2 
                      className="text-3xl font-bold" 
                      style={{ 
                        fontFamily: form.watch("font_heading"),
                        color: form.watch("primary_color")
                      }}
                    >
                      The Quick Brown Fox
                    </h2>
                    <p 
                      className="text-base" 
                      style={{ 
                        fontFamily: form.watch("font_body"),
                        color: form.watch("text_color")
                      }}
                    >
                      This is how your body text will look. It should be easy to read and match your brand's personality.
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Contact Tab */}
              <TabsContent value="contact" className="space-y-4">
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="contact@company.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="(555) 123-4567" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://yourwebsite.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4 pt-4">
                    <h4 className="font-semibold">Business Address</h4>
                    <FormField
                      control={form.control}
                      name="address_line1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123 Main Street" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address_line2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Suite 100" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="City" />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="State" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {US_STATES.map((state) => (
                                  <SelectItem key={state} value={state}>
                                    {state}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="zip_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="12345" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h4 className="font-semibold">Social Media</h4>
                    <FormField
                      control={form.control}
                      name="linkedin_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://linkedin.com/in/yourprofile" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="facebook_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://facebook.com/yourpage" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="instagram_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://instagram.com/yourhandle" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-4">
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Brand Preview</h3>
                  
                  <div className="border border-border rounded-lg p-8 space-y-6 bg-background">
                    {/* Header Preview */}
                    <div className="flex items-center gap-4 pb-4 border-b border-border">
                      {logoPreview && (
                        <img src={logoPreview} alt="Logo" className="h-16 object-contain" />
                      )}
                      <div className="flex-1">
                        <h2 
                          className="text-2xl font-bold" 
                          style={{ 
                            fontFamily: form.watch("font_heading"),
                            color: form.watch("primary_color")
                          }}
                        >
                          {form.watch("company_name") || "Your Company Name"}
                        </h2>
                        {form.watch("tagline") && (
                          <p 
                            className="text-sm italic mt-1"
                            style={{ 
                              fontFamily: form.watch("font_body"),
                              color: form.watch("text_color")
                            }}
                          >
                            {form.watch("tagline")}
                          </p>
                        )}
                      </div>
                      {agentPhotoPreview && (
                        <img src={agentPhotoPreview} alt="Agent" className="h-20 w-20 rounded-full object-cover" />
                      )}
                    </div>

                    {/* Color Palette Preview */}
                    <div>
                      <p className="text-sm font-medium mb-3">Color Palette</p>
                      <div className="flex gap-3">
                        <div 
                          className="h-16 w-16 rounded-lg shadow-sm border border-border" 
                          style={{ backgroundColor: form.watch("primary_color") }}
                          title="Primary"
                        />
                        <div 
                          className="h-16 w-16 rounded-lg shadow-sm border border-border" 
                          style={{ backgroundColor: form.watch("secondary_color") }}
                          title="Secondary"
                        />
                        <div 
                          className="h-16 w-16 rounded-lg shadow-sm border border-border" 
                          style={{ backgroundColor: form.watch("accent_color") }}
                          title="Accent"
                        />
                        <div 
                          className="h-16 w-16 rounded-lg shadow-sm border border-border" 
                          style={{ backgroundColor: form.watch("text_color") }}
                          title="Text"
                        />
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="space-y-3">
                      <h3 
                        className="text-xl font-bold"
                        style={{ 
                          fontFamily: form.watch("font_heading"),
                          color: form.watch("primary_color")
                        }}
                      >
                        Sample Heading
                      </h3>
                      <p 
                        style={{ 
                          fontFamily: form.watch("font_body"),
                          color: form.watch("text_color")
                        }}
                      >
                        This is how your body text will appear in marketing materials. It uses your selected typography and color scheme to maintain brand consistency across all communications.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isUploading || createBrandKit.isPending || updateBrandKit.isPending}
              >
                {(isUploading || createBrandKit.isPending || updateBrandKit.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Brand Kit"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
