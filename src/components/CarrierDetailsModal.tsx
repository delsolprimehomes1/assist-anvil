import { Building2, Phone, Globe, MapPin, Calendar, Users, ExternalLink, Star, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Carrier {
  id: number;
  name: string;
  shortCode: string;
  amBestRating: string;
  products: string[];
  niches: string[];
  turnaround: string;
  logoUrl: string;
  portalUrl: string;
  quotesUrl: string;
  illustrationUrl: string;
  headquarters: string;
  phone: string;
  founded: number;
  employees: string;
  description: string;
  website: string;
  specialProducts: string[];
  underwritingStrengths: string[];
  companyHistory: string;
}

interface CarrierDetailsModalProps {
  carrier: Carrier | null;
  isOpen: boolean;
  onClose: () => void;
}

const CarrierDetailsModal = ({ carrier, isOpen, onClose }: CarrierDetailsModalProps) => {
  if (!carrier) return null;

  const getTurnaroundColor = (turnaround: string) => {
    switch (turnaround) {
      case "fast": return "bg-success text-success-foreground";
      case "avg": return "bg-warning text-warning-foreground";
      case "slow": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-full md:h-auto md:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-secondary rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl md:text-2xl">{carrier.name}</DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                {carrier.shortCode} • A.M. Best Rating: {carrier.amBestRating}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="underwriting">Underwriting</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4 px-1 md:px-0">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Company Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Founded: {carrier.founded}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Employees: {carrier.employees}</span>
                    </div>
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>A.M. Best Rating: {carrier.amBestRating}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Turnaround Time</h3>
                  <Badge className={`${getTurnaroundColor(carrier.turnaround)}`}>
                    {carrier.turnaround.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {carrier.description}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Company History</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {carrier.companyHistory}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 mt-4 px-1 md:px-0">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Headquarters
                  </h3>
                  <p className="text-sm text-muted-foreground">{carrier.headquarters}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone
                  </h3>
                  <a href={`tel:${carrier.phone}`} className="text-sm text-primary hover:underline">
                    {carrier.phone}
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </h3>
                  <a 
                    href={carrier.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center"
                  >
                    {carrier.website}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button className="w-full justify-start h-11 md:h-10" asChild>
                    <a href={carrier.portalUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Access Agent Portal
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-11 md:h-10" asChild>
                    <a href={carrier.quotesUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Get Quotes
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-11 md:h-10" asChild>
                    <a href={carrier.illustrationUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Run Illustrations
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4 mt-4 px-1 md:px-0">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Available Products</h3>
                <div className="flex flex-wrap gap-2">
                  {carrier.products.map(product => (
                    <Badge key={product} variant="secondary">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Market Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {carrier.niches.map(niche => (
                    <Badge key={niche} variant="outline">
                      {niche.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">Specialized Products & Features</h3>
              <div className="grid grid-cols-1 gap-4">
                {carrier.specialProducts.map((product, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">{product}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="underwriting" className="space-y-4 mt-4 px-1 md:px-0">
            <div>
              <h3 className="font-semibold mb-3">Underwriting Strengths</h3>
              <div className="space-y-3">
                {carrier.underwritingStrengths.map((strength, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{strength}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-semibold mb-1">Processing Speed</h4>
                <Badge className={`${getTurnaroundColor(carrier.turnaround)}`}>
                  {carrier.turnaround.toUpperCase()}
                </Badge>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-semibold mb-1">Financial Rating</h4>
                <Badge variant="outline">{carrier.amBestRating}</Badge>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-semibold mb-1">Market Focus</h4>
                <Badge variant="secondary">{carrier.niches[0]?.replace('_', ' ') || 'General'}</Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CarrierDetailsModal;