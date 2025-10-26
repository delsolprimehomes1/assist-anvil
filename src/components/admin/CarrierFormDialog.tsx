import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Plus, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CarrierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carrier?: any;
  onSuccess: () => void;
}

const PRODUCTS = ["Term", "Whole Life", "Final Expense", "Annuity", "IUL"];
const NICHES = ["smoker", "diabetes", "senior", "fast_approval", "annuity", "digital", "no_exam"];
const AM_BEST_RATINGS = ["A++", "A+", "A", "A-", "B++", "B+", "B", "B-", "C++", "C+"];

export function CarrierFormDialog({ open, onOpenChange, carrier, onSuccess }: CarrierFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form state
  const [formData, setFormData] = useState({
    name: carrier?.name || "",
    short_code: carrier?.short_code || "",
    am_best_rating: carrier?.am_best_rating || "",
    headquarters: carrier?.headquarters || "",
    phone: carrier?.phone || "",
    founded: carrier?.founded || "",
    employees: carrier?.employees || "",
    website: carrier?.website || "",
    description: carrier?.description || "",
    company_history: carrier?.company_history || "",
    products: carrier?.products || [],
    niches: carrier?.niches || [],
    turnaround: carrier?.turnaround || "",
    portal_url: carrier?.portal_url || "",
    quotes_url: carrier?.quotes_url || "",
    illustration_url: carrier?.illustration_url || "",
    special_products: carrier?.special_products || [""],
    underwriting_strengths: carrier?.underwriting_strengths || [""],
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [pdfFiles, setPdfFiles] = useState<Array<{ 
    title: string; 
    button_label: string; 
    file: File | null;
    url?: string;
    file_path?: string;
    isExisting?: boolean;
  }>>([
    { title: "", button_label: "", file: null }
  ]);

  // Reset form when carrier prop changes or dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: carrier?.name || "",
        short_code: carrier?.short_code || "",
        am_best_rating: carrier?.am_best_rating || "",
        headquarters: carrier?.headquarters || "",
        phone: carrier?.phone || "",
        founded: carrier?.founded || "",
        employees: carrier?.employees || "",
        website: carrier?.website || "",
        description: carrier?.description || "",
        company_history: carrier?.company_history || "",
        products: carrier?.products || [],
        niches: carrier?.niches || [],
        turnaround: carrier?.turnaround || "",
        portal_url: carrier?.portal_url || "",
        quotes_url: carrier?.quotes_url || "",
        illustration_url: carrier?.illustration_url || "",
        special_products: carrier?.special_products?.length > 0 ? carrier.special_products : [""],
        underwriting_strengths: carrier?.underwriting_strengths?.length > 0 ? carrier.underwriting_strengths : [""],
      });
      
      // Reset logo file
      setLogoFile(null);
      
      // Populate existing PDFs or reset to empty
      if (carrier?.pdf_documents && carrier.pdf_documents.length > 0) {
        setPdfFiles(carrier.pdf_documents.map((pdf: any) => ({
          title: pdf.title || "",
          button_label: pdf.button_label || "",
          file: null,
          url: pdf.url,
          file_path: pdf.file_path,
          isExisting: true
        })));
      } else {
        setPdfFiles([{ title: "", button_label: "", file: null }]);
      }
      
      // Reset to first step
      setStep(1);
    }
  }, [carrier, open]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProductToggle = (product: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.includes(product)
        ? prev.products.filter((p: string) => p !== product)
        : [...prev.products, product]
    }));
  };

  const handleNicheToggle = (niche: string) => {
    setFormData(prev => ({
      ...prev,
      niches: prev.niches.includes(niche)
        ? prev.niches.filter((n: string) => n !== niche)
        : [...prev.niches, niche]
    }));
  };

  const addSpecialProduct = () => {
    setFormData(prev => ({
      ...prev,
      special_products: [...prev.special_products, ""]
    }));
  };

  const removeSpecialProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      special_products: prev.special_products.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateSpecialProduct = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      special_products: prev.special_products.map((item: string, i: number) => i === index ? value : item)
    }));
  };

  const addUnderwritingStrength = () => {
    setFormData(prev => ({
      ...prev,
      underwriting_strengths: [...prev.underwriting_strengths, ""]
    }));
  };

  const removeUnderwritingStrength = (index: number) => {
    setFormData(prev => ({
      ...prev,
      underwriting_strengths: prev.underwriting_strengths.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateUnderwritingStrength = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      underwriting_strengths: prev.underwriting_strengths.map((item: string, i: number) => i === index ? value : item)
    }));
  };

  const addPdfField = () => {
    setPdfFiles(prev => [...prev, { title: "", button_label: "", file: null }]);
  };

  const removePdfField = (index: number) => {
    setPdfFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updatePdfField = (index: number, field: string, value: any) => {
    setPdfFiles(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('carrier-assets')
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('carrier-assets')
      .getPublicUrl(path);

    return { filePath: data.path, publicUrl };
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.short_code) {
      toast({
        title: "Error",
        description: "Carrier name and short code are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let logoUrl = carrier?.logo_url || null;
      
      // Upload logo if new file selected
      if (logoFile) {
        const logoPath = `logos/${formData.short_code}-${Date.now()}.${logoFile.name.split('.').pop()}`;
        const { publicUrl } = await uploadFile(logoFile, logoPath);
        logoUrl = publicUrl;
      }

      // Keep existing PDFs and add new ones
      const existingPdfs = pdfFiles
        .filter(pdf => pdf.isExisting && pdf.url)
        .map(pdf => ({
          title: pdf.title,
          button_label: pdf.button_label,
          url: pdf.url,
          file_path: pdf.file_path
        }));

      // Upload new PDFs
      const newPdfDocuments = [];
      for (const pdf of pdfFiles) {
        if (pdf.file && pdf.title && pdf.button_label) {
          const pdfPath = `pdfs/${formData.short_code}-${Date.now()}-${pdf.file.name}`;
          const { publicUrl, filePath } = await uploadFile(pdf.file, pdfPath);
          newPdfDocuments.push({
            title: pdf.title,
            button_label: pdf.button_label,
            url: publicUrl,
            file_path: filePath
          });
        }
      }

      const carrierData = {
        ...formData,
        logo_url: logoUrl,
        pdf_documents: [...existingPdfs, ...newPdfDocuments],
        special_products: formData.special_products.filter((p: string) => p.trim()),
        underwriting_strengths: formData.underwriting_strengths.filter((s: string) => s.trim()),
        created_by: carrier ? undefined : user.id,
      };

      if (carrier) {
        const { error } = await supabase
          .from('carriers')
          .update(carrierData)
          .eq('id', carrier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('carriers')
          .insert(carrierData);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Carrier ${carrier ? 'updated' : 'added'} successfully`,
      });

      onSuccess();
      onOpenChange(false);
      setStep(1);
    } catch (error: any) {
      console.error('Error saving carrier:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Carrier Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="American General"
              />
            </div>
            <div>
              <Label htmlFor="short_code">Short Code *</Label>
              <Input
                id="short_code"
                value={formData.short_code}
                onChange={(e) => handleInputChange('short_code', e.target.value)}
                placeholder="AG"
              />
            </div>
            <div>
              <Label htmlFor="am_best_rating">AM Best Rating</Label>
              <Select value={formData.am_best_rating} onValueChange={(val) => handleInputChange('am_best_rating', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  {AM_BEST_RATINGS.map(rating => (
                    <SelectItem key={rating} value={rating}>{rating}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="1-800-555-0100"
              />
            </div>
            <div>
              <Label htmlFor="headquarters">Headquarters</Label>
              <Input
                id="headquarters"
                value={formData.headquarters}
                onChange={(e) => handleInputChange('headquarters', e.target.value)}
                placeholder="Houston, TX"
              />
            </div>
            <div>
              <Label htmlFor="founded">Founded Year</Label>
              <Input
                id="founded"
                value={formData.founded}
                onChange={(e) => handleInputChange('founded', e.target.value)}
                placeholder="1951"
              />
            </div>
            <div>
              <Label htmlFor="employees">Number of Employees</Label>
              <Input
                id="employees"
                value={formData.employees}
                onChange={(e) => handleInputChange('employees', e.target.value)}
                placeholder="3,000+"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label>Products</Label>
              <div className="space-y-2 mt-2">
                {PRODUCTS.map(product => (
                  <div key={product} className="flex items-center space-x-2">
                    <Checkbox
                      id={product}
                      checked={formData.products.includes(product)}
                      onCheckedChange={() => handleProductToggle(product)}
                    />
                    <label htmlFor={product} className="text-sm cursor-pointer">{product}</label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Niches</Label>
              <div className="space-y-2 mt-2">
                {NICHES.map(niche => (
                  <div key={niche} className="flex items-center space-x-2">
                    <Checkbox
                      id={niche}
                      checked={formData.niches.includes(niche)}
                      onCheckedChange={() => handleNicheToggle(niche)}
                    />
                    <label htmlFor={niche} className="text-sm cursor-pointer capitalize">{niche.replace('_', ' ')}</label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="turnaround">Turnaround Time</Label>
              <Select value={formData.turnaround} onValueChange={(val) => handleInputChange('turnaround', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select turnaround" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">Fast</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="slow">Slow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="portal_url">Agent Portal URL</Label>
              <Input
                id="portal_url"
                value={formData.portal_url}
                onChange={(e) => handleInputChange('portal_url', e.target.value)}
                placeholder="https://portal.example.com"
              />
            </div>
            <div>
              <Label htmlFor="quotes_url">Quotes Portal URL</Label>
              <Input
                id="quotes_url"
                value={formData.quotes_url}
                onChange={(e) => handleInputChange('quotes_url', e.target.value)}
                placeholder="https://quotes.example.com"
              />
            </div>
            <div>
              <Label htmlFor="illustration_url">Illustration Tool URL</Label>
              <Input
                id="illustration_url"
                value={formData.illustration_url}
                onChange={(e) => handleInputChange('illustration_url', e.target.value)}
                placeholder="https://illustration.example.com"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Special Products</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSpecialProduct}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {formData.special_products.map((product: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={product}
                    onChange={(e) => updateSpecialProduct(index, e.target.value)}
                    placeholder="Term Life with conversion options"
                  />
                  {formData.special_products.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeSpecialProduct(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Underwriting Strengths</Label>
                <Button type="button" variant="outline" size="sm" onClick={addUnderwritingStrength}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {formData.underwriting_strengths.map((strength: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={strength}
                    onChange={(e) => updateUnderwritingStrength(index, e.target.value)}
                    placeholder="Competitive rates for smokers"
                  />
                  {formData.underwriting_strengths.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeUnderwritingStrength(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Company Description (500 chars max)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value.slice(0, 500))}
                placeholder="Brief company overview..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">{formData.description.length}/500</p>
            </div>
            <div>
              <Label htmlFor="company_history">Company History (1000 chars max)</Label>
              <Textarea
                id="company_history"
                value={formData.company_history}
                onChange={(e) => handleInputChange('company_history', e.target.value.slice(0, 1000))}
                placeholder="Detailed company history..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-1">{formData.company_history.length}/1000</p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div>
              <Label>Carrier Logo</Label>
              <div className="mt-2">
                {logoFile || carrier?.logo_url ? (
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {(logoFile || carrier?.logo_url) && (
                          <img
                            src={logoFile ? URL.createObjectURL(logoFile) : carrier?.logo_url}
                            alt="Logo preview"
                            className="h-12 w-12 object-contain"
                          />
                        )}
                        <span className="text-sm">{logoFile?.name || "Current logo"}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('logo-replace-input')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Replace
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setLogoFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <input
                      id="logo-replace-input"
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size <= 2 * 1024 * 1024) {
                          setLogoFile(file);
                        } else {
                          toast({
                            title: "Error",
                            description: "File must be under 2MB",
                            variant: "destructive",
                          });
                        }
                        e.target.value = '';
                      }}
                    />
                  </Card>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload logo</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WebP (Max 2MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size <= 2 * 1024 * 1024) {
                          setLogoFile(file);
                        } else {
                          toast({
                            title: "Error",
                            description: "File must be under 2MB",
                            variant: "destructive",
                          });
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Label>PDF Documents</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPdfField}>
                <Plus className="h-4 w-4 mr-1" /> Add PDF
              </Button>
            </div>
            {pdfFiles.map((pdf, index) => (
              <Card key={index} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  {pdfFiles.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePdfField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Document Title (e.g., Underwriting Guide 2024)"
                  value={pdf.title}
                  onChange={(e) => updatePdfField(index, 'title', e.target.value)}
                />
                <Input
                  placeholder="Button Label (e.g., Download Guide)"
                  value={pdf.button_label}
                  onChange={(e) => updatePdfField(index, 'button_label', e.target.value)}
                />
                {pdf.isExisting && pdf.url && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    <FileText className="h-4 w-4" />
                    <a href={pdf.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                      View current PDF
                    </a>
                    <span className="text-xs">(existing)</span>
                  </div>
                )}
                {!pdf.isExisting && (
                  <label className="flex items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                    {pdf.file ? (
                      <span className="text-sm">{pdf.file.name}</span>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Upload PDF</p>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          updatePdfField(index, 'file', file);
                        }
                      }}
                    />
                  </label>
                )}
              </Card>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{carrier ? 'Edit' : 'Add New'} Carrier</DialogTitle>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded ${s <= step ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Step {step} of 7: {
              step === 1 ? "Basic Information" :
              step === 2 ? "Products & Niches" :
              step === 3 ? "Portal URLs" :
              step === 4 ? "Special Features" :
              step === 5 ? "Descriptions" :
              step === 6 ? "Logo" :
              "PDF Documents"
            }
          </p>
        </DialogHeader>

        <div className="py-4">
          {renderStep()}
        </div>

        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Previous
            </Button>
          )}
          {step < 7 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : carrier ? "Update Carrier" : "Add Carrier"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
