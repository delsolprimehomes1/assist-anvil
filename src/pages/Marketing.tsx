import { useState } from "react";
import { Megaphone, Copy, ExternalLink, Download, Palette, Mail, MessageSquare, Plus, Edit, Trash2, Eye, Rocket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useBrandKit } from "@/hooks/useBrandKit";
import { useMarketingTemplates } from "@/hooks/useMarketingTemplates";
import { useMarketingResources } from "@/hooks/useMarketingResources";
import { BrandKitEditor } from "@/components/marketing/BrandKitEditor";
import { BrandKitDisplay } from "@/components/marketing/BrandKitDisplay";
import { TemplateEditor } from "@/components/marketing/TemplateEditor";
import { CustomBuildsForm } from "@/components/marketing/CustomBuildsForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const templates = [
  {
    id: 1,
    title: "Life Insurance Consultation Flyer",
    type: "canva_template",
    description: "Professional flyer for promoting consultation services",
    url: "https://canva.com/template/123",
    tags: ["flyer", "consultation", "life_insurance"]
  },
  {
    id: 2,
    title: "Final Expense Social Media Post",
    type: "canva_template", 
    description: "Engaging social media graphics for FE products",
    url: "https://canva.com/template/456",
    tags: ["social_media", "final_expense"]
  },
  {
    id: 3,
    title: "Term Life Email Template",
    type: "email_script",
    description: "Professional email template for term life prospects",
    content: "Subject: Protect Your Family's Future Today\n\nDear [Name],\n\nI hope this email finds you well. As someone who cares about their family's financial security, I wanted to reach out about an important topic - life insurance protection.\n\nTerm life insurance can provide:\n• Affordable premiums\n• Flexible coverage amounts\n• Peace of mind for your loved ones\n\nI'd love to schedule a brief 15-minute call to discuss your specific needs and see how I can help.\n\nBest regards,\n[Your Name]",
    tags: ["email", "term_life", "prospecting"]
  },
  {
    id: 4,
    title: "Follow-up SMS Script",
    type: "sms_script",
    description: "Friendly follow-up message for warm leads",
    content: "Hi [Name]! Thanks for your interest in life insurance. I have some great options that could save you money while providing better coverage. When would be a good time for a quick 10-minute call? - [Your Name]",
    tags: ["sms", "follow_up", "warm_leads"]
  }
];

const brandAssets = [
  {
    id: 1,
    title: "Company Logo Pack",
    type: "brand_asset",
    description: "High-resolution logos in various formats",
    downloadUrl: "/brand/logos.zip",
    tags: ["logo", "branding"]
  },
  {
    id: 2,
    title: "Brand Guidelines",
    type: "brand_asset",
    description: "Official brand colors, fonts, and usage guidelines",
    downloadUrl: "/brand/guidelines.pdf",
    tags: ["guidelines", "branding"]
  }
];

const Marketing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const { toast } = useToast();
  
  const { brandKit, isLoading: isBrandKitLoading, deleteBrandKit } = useBrandKit();
  const { templates: userTemplates, deleteTemplate } = useMarketingTemplates();
  const { resources: agencyTemplates, isLoading: isAgencyLoading } = useMarketingResources("canva_template");
  const { resources: agencyScripts } = useMarketingResources();
  const { resources: agencyCreatives } = useMarketingResources("creative");
  
  const [brandKitEditorOpen, setBrandKitEditorOpen] = useState(false);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [brandKitDeleteDialogOpen, setBrandKitDeleteDialogOpen] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<any>(null);

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setTemplateEditorOpen(true);
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateEditorOpen(true);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (templateToDelete) {
      await deleteTemplate.mutateAsync(templateToDelete);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const confirmBrandKitDelete = async () => {
    await deleteBrandKit.mutateAsync();
    setBrandKitDeleteDialogOpen(false);
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Content copied successfully",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "canva_template": return Palette;
      case "email_script": return Mail;
      case "sms_script": return MessageSquare;
      case "brand_asset": return Download;
      default: return Megaphone;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "canva_template": return "bg-purple-100 text-purple-800";
      case "email_script": return "bg-blue-100 text-blue-800";
      case "sms_script": return "bg-green-100 text-green-800";
      case "brand_asset": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-primary" />
            Marketing Center
          </h1>
          <p className="text-muted-foreground">Templates, scripts, and brand assets to grow your business</p>
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="creatives">Creatives</TabsTrigger>
          <TabsTrigger value="brand">Brand Kit</TabsTrigger>
          <TabsTrigger value="custom-builds" className="flex items-center gap-1.5">
            <Rocket className="h-4 w-4" />
            Custom Builds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Header with New Template Button */}
          <div className="flex items-center justify-between">
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={handleNewTemplate}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </div>

          {/* User's Canva Templates */}
          {userTemplates.filter(t => t.type === "canva_template").length > 0 && (
            <>
              <h3 className="text-lg font-semibold">My Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userTemplates.filter(t => t.type === "canva_template").map((template, index) => {
                  const Icon = getTypeIcon(template.type);
                  return (
                    <Card key={template.id} className="stat-card hover-lift" style={{ animationDelay: `${index * 0.1}s` }}>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg truncate">{template.title}</CardTitle>
                              <CardDescription className="text-sm">
                                {template.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleEditTemplate(template)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteTemplate(template.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-1">
                          {template.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>

                        <Button className="w-full" asChild>
                          <a href={template.url || "#"} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open in Canva
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* Agency Canva Templates */}
          <h3 className="text-lg font-semibold">Agency Templates</h3>
          {isAgencyLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading agency templates...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agencyTemplates.map((template, index) => {
                const Icon = getTypeIcon(template.type);
                return (
                  <Card key={template.id} className="stat-card hover-lift" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{template.title}</CardTitle>
                            <CardDescription className="text-sm">
                              {template.description}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>

                      <Button className="w-full" asChild>
                        <a href={template.url || "#"} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open in Canva
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scripts" className="space-y-6">
          {/* Header with New Script Button */}
          <div className="flex justify-end">
            <Button onClick={handleNewTemplate}>
              <Plus className="mr-2 h-4 w-4" />
              New Script
            </Button>
          </div>

          {/* User's Scripts */}
          {userTemplates.filter(t => t.type === "email_script" || t.type === "sms_script").length > 0 && (
            <>
              <h3 className="text-lg font-semibold">My Scripts</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {userTemplates.filter(t => t.type === "email_script" || t.type === "sms_script").map((script, index) => {
                  const Icon = getTypeIcon(script.type);
                  return (
                    <Card key={script.id} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <Icon className="h-5 w-5 text-primary" />
                            <CardTitle>{script.title}</CardTitle>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleEditTemplate(script)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteTemplate(script.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription>{script.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <pre className="text-sm whitespace-pre-wrap font-sans">
                            {script.content}
                          </pre>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {script.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>

                        <Button 
                          onClick={() => copyToClipboard(script.content || "")}
                          className="w-full"
                          variant="outline"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Script
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* Agency Scripts */}
          <h3 className="text-lg font-semibold">Agency Scripts</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agencyScripts.filter(s => s.type === "email_script" || s.type === "sms_script").map((script, index) => {
              const Icon = getTypeIcon(script.type);
              return (
                <Card key={script.id} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {script.title}
                    </CardTitle>
                    <CardDescription>{script.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap font-sans">
                        {script.content}
                      </pre>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {script.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>

                    <Button 
                      onClick={() => copyToClipboard(script.content || "")}
                      className="w-full"
                      variant="outline"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Script
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="creatives" className="space-y-6">
          <h3 className="text-lg font-semibold">Agency Creatives</h3>
          {agencyCreatives.length === 0 ? (
            <Card className="stat-card">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No creatives available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agencyCreatives.map((creative, index) => {
                const isImageFile = creative.file_url && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(creative.file_url);
                const previewUrl = creative.thumbnail_url || (isImageFile ? creative.file_url : null);
                
                return (
                  <Card key={creative.id} className="stat-card hover-lift overflow-hidden" style={{ animationDelay: `${index * 0.1}s` }}>
                    {previewUrl && (
                      <div 
                        className="aspect-[4/3] bg-muted cursor-pointer group relative"
                        onClick={() => setSelectedCreative(creative)}
                      >
                        <img 
                          src={previewUrl} 
                          alt={creative.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    )}
                    
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{creative.title}</CardTitle>
                      <CardDescription className="text-sm">{creative.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {creative.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>

                      {creative.file_url && (
                        <Button className="w-full" asChild>
                          <a href={creative.file_url} download target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="brand" className="space-y-6">
          {/* Brand Kit Section */}
          {isBrandKitLoading ? (
            <Card className="stat-card">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Loading brand kit...</p>
              </CardContent>
            </Card>
          ) : brandKit ? (
            <BrandKitDisplay 
              brandKit={brandKit} 
              onEdit={() => setBrandKitEditorOpen(true)} 
              onDelete={() => setBrandKitDeleteDialogOpen(true)}
            />
          ) : (
            <Card className="stat-card">
              <CardContent className="py-12 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Palette className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Create Your Brand Kit</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Set up your company branding to personalize all your marketing materials with your logo, colors, and contact information.
                  </p>
                </div>
                <Button onClick={() => setBrandKitEditorOpen(true)} size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Brand Kit
                </Button>
              </CardContent>
            </Card>
          )}

          {/* User's Brand Assets */}
          {userTemplates.filter(t => t.type === "brand_asset").length > 0 && (
            <>
              <h3 className="text-lg font-semibold">My Brand Assets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userTemplates.filter(t => t.type === "brand_asset").map((asset, index) => {
                  const Icon = getTypeIcon(asset.type);
                  return (
                    <Card key={asset.id} className="stat-card hover-lift" style={{ animationDelay: `${index * 0.1}s` }}>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">{asset.title}</CardTitle>
                              <CardDescription className="text-sm">
                                {asset.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleEditTemplate(asset)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteTemplate(asset.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-1">
                          {asset.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>

                        <Button className="w-full" asChild>
                          <a href={asset.file_url || "#"} download>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="custom-builds">
          <CustomBuildsForm />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BrandKitEditor
        open={brandKitEditorOpen}
        onOpenChange={setBrandKitEditorOpen}
        brandKit={brandKit}
      />

      <TemplateEditor
        open={templateEditorOpen}
        onOpenChange={setTemplateEditorOpen}
        template={editingTemplate}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={brandKitDeleteDialogOpen} onOpenChange={setBrandKitDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand Kit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your brand kit including all uploaded images. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBrandKitDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selectedCreative} onOpenChange={() => setSelectedCreative(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedCreative?.title}</DialogTitle>
          </DialogHeader>
          {selectedCreative && (
            <div className="space-y-4">
              {(selectedCreative.thumbnail_url || selectedCreative.file_url) && (
                <div className="bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={selectedCreative.thumbnail_url || selectedCreative.file_url} 
                    alt={selectedCreative.title}
                    className="w-full h-auto max-h-[70vh] object-contain"
                  />
                </div>
              )}
              <p className="text-sm text-muted-foreground">{selectedCreative.description}</p>
              <div className="flex flex-wrap gap-2">
                {selectedCreative.tags?.map((tag: string, i: number) => (
                  <Badge key={i} variant="outline">
                    {tag.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
              {selectedCreative.file_url && (
                <Button className="w-full" asChild>
                  <a href={selectedCreative.file_url} download target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketing;