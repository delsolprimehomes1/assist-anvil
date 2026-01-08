import { useState, useEffect } from "react";
import { Calculator, FileText, Search, BookOpen, ExternalLink, Download, Building2, ImageIcon, Video } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalculatorHub } from "@/components/tools/CalculatorHub";
import { CarrierQuotingHub } from "@/components/tools/CarrierQuotingHub";
import { ImageGenerator } from "@/components/tools/ImageGenerator";
import { VideoUnderstanding } from "@/components/tools/VideoUnderstanding";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CarrierGuide {
  id: string;
  carrier_name: string;
  carrier_logo?: string;
  guide_title: string;
  guide_url: string;
}

const Tools = () => {
  const [activeTab, setActiveTab] = useState("resources");
  const [guideSearchTerm, setGuideSearchTerm] = useState("");
  const [carrierGuides, setCarrierGuides] = useState<CarrierGuide[]>([]);
  const [guidesLoading, setGuidesLoading] = useState(true);

  useEffect(() => {
    fetchCarrierGuides();
  }, []);

  const fetchCarrierGuides = async () => {
    try {
      setGuidesLoading(true);
      const { data: carriers, error } = await supabase
        .from('carriers')
        .select('id, name, logo_url, pdf_documents')
        .not('pdf_documents', 'is', null);

      if (error) throw error;

      const guides: CarrierGuide[] = [];
      carriers?.forEach(carrier => {
        const docs = carrier.pdf_documents as any[];
        if (Array.isArray(docs)) {
          docs.forEach(doc => {
            guides.push({
              id: `${carrier.id}-${doc.url}`,
              carrier_name: carrier.name,
              carrier_logo: carrier.logo_url,
              guide_title: doc.title,
              guide_url: doc.url
            });
          });
        }
      });

      setCarrierGuides(guides);
    } catch (error) {
      console.error('Error fetching carrier guides:', error);
      toast({
        title: "Error",
        description: "Failed to load carrier guides",
        variant: "destructive"
      });
    } finally {
      setGuidesLoading(false);
    }
  };

  const handleDownload = (url: string, title: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: `Downloading ${title}...`
    });
  };

  const filteredGuides = carrierGuides.filter(guide =>
    guide.carrier_name.toLowerCase().includes(guideSearchTerm.toLowerCase()) ||
    guide.guide_title.toLowerCase().includes(guideSearchTerm.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "calculator": return Calculator;
      case "guide": return BookOpen;
      case "cheat_sheet": return FileText;
      case "tool": return ExternalLink;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "calculator": return "bg-blue-100 text-blue-800";
      case "guide": return "bg-green-100 text-green-800";
      case "cheat_sheet": return "bg-purple-100 text-purple-800";
      case "tool": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Tools & Resources</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Essential calculators, guides, and resources</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-10 sm:h-11">
          <TabsTrigger value="resources" className="text-xs sm:text-sm">Quoting</TabsTrigger>
          <TabsTrigger value="calculators" className="text-xs sm:text-sm">Calculators</TabsTrigger>
          <TabsTrigger value="guides" className="text-xs sm:text-sm">Guides</TabsTrigger>
          <TabsTrigger value="images" className="text-xs sm:text-sm">Images</TabsTrigger>
          <TabsTrigger value="video" className="text-xs sm:text-sm">Video</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-6">
          <CarrierQuotingHub />
        </TabsContent>

        <TabsContent value="calculators" className="space-y-6">
          <CalculatorHub />
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search carrier guides..."
                  value={guideSearchTerm}
                  onChange={(e) => setGuideSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Featured Resource */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                FE Health Questions
              </CardTitle>
              <CardDescription>Common final expense health questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p>• Hospitalized in past 2 years?</p>
                <p>• Currently taking insulin?</p>
                <p>• Diagnosed with cancer?</p>
                <p>• Heart attack or stroke?</p>
              </div>
              <Button variant="outline" className="w-full" size="sm">
                View Full Matrix
              </Button>
            </CardContent>
          </Card>

          {/* Carrier Guides Grid */}
          {guidesLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                <p className="text-muted-foreground">Loading carrier guides...</p>
              </CardContent>
            </Card>
          ) : filteredGuides.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuides.map((guide) => (
                <Card key={guide.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      {guide.carrier_logo ? (
                        <img 
                          src={guide.carrier_logo} 
                          alt={guide.carrier_name}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {guide.carrier_name}
                        </CardTitle>
                        <CardDescription className="text-base font-semibold text-foreground mt-1">
                          {guide.guide_title}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDownload(guide.guide_url, guide.guide_title)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Guides Found</h3>
                <p className="text-muted-foreground text-sm">
                  {guideSearchTerm ? 'Try adjusting your search terms' : 'No carrier guides available'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="images" className="space-y-6">
          <ImageGenerator />
        </TabsContent>

        <TabsContent value="video" className="space-y-6">
          <VideoUnderstanding />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tools;