import { useState } from "react";
import { Search, Filter, Building2, ExternalLink, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const carriers = [
  {
    id: 1,
    name: "American General",
    shortCode: "AG",
    amBestRating: "A",
    products: ["Term", "WL", "FE"],
    niches: ["smoker", "diabetes"],
    turnaround: "fast",
    logoUrl: "/carriers/ag.png",
    portalUrl: "https://portal.ag.com",
    quotesUrl: "https://quotes.ag.com",
    illustrationUrl: "https://illustrations.ag.com"
  },
  {
    id: 2,
    name: "Mutual of Omaha",
    shortCode: "MOO",
    amBestRating: "A+",
    products: ["Term", "WL", "FE", "Annuity"],
    niches: ["senior", "fast_approval"],
    turnaround: "avg",
    logoUrl: "/carriers/moo.png",
    portalUrl: "https://portal.moo.com",
    quotesUrl: "https://quotes.moo.com",
    illustrationUrl: "https://illustrations.moo.com"
  },
  {
    id: 3,
    name: "Foresters Financial",
    shortCode: "FF",
    amBestRating: "A",
    products: ["Term", "WL"],
    niches: ["fast_approval"],
    turnaround: "fast",
    logoUrl: "/carriers/ff.png",
    portalUrl: "https://www.forestersmobile.com/",
    quotesUrl: "https://quotes.foresters.com",
    illustrationUrl: "https://illustrations.foresters.com"
  },
  {
    id: 4,
    name: "Americo",
    shortCode: "AMR",
    amBestRating: "A-",
    products: ["Term", "WL", "FE"],
    niches: ["senior", "fast_approval"],
    turnaround: "avg",
    logoUrl: "/carriers/americo.png",
    portalUrl: "https://account.americoagent.com/Identity/Account/Login/?returnUrl=https%3a%2f%2ftools.americoagent.com%2f",
    quotesUrl: "https://quotes.americo.com",
    illustrationUrl: "https://illustrations.americo.com"
  },
  {
    id: 5,
    name: "Fidelity & Guaranty Life",
    shortCode: "F&G",
    amBestRating: "A",
    products: ["Term", "WL", "Annuity"],
    niches: ["annuity", "senior"],
    turnaround: "avg",
    logoUrl: "/carriers/fg.png",
    portalUrl: "https://saleslink.fglife.com/login/portallogin",
    quotesUrl: "https://quotes.fglife.com",
    illustrationUrl: "https://illustrations.fglife.com"
  }
];

const Carriers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("all");

  const filteredCarriers = carriers.filter(carrier => {
    const matchesSearch = carrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         carrier.shortCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = selectedProduct === "all" || carrier.products.includes(selectedProduct);
    return matchesSearch && matchesProduct;
  });

  const getTurnaroundColor = (turnaround: string) => {
    switch (turnaround) {
      case "fast": return "bg-success text-success-foreground";
      case "avg": return "bg-warning text-warning-foreground";
      case "slow": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Insurance Carriers</h1>
          <p className="text-muted-foreground">Browse carriers, access portals, and find the right fit for your clients</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="stat-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search carriers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Product Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="Term">Term Life</SelectItem>
                <SelectItem value="WL">Whole Life</SelectItem>
                <SelectItem value="FE">Final Expense</SelectItem>
                <SelectItem value="Annuity">Annuity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Carriers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCarriers.map((carrier, index) => (
          <Card key={carrier.id} className="stat-card hover-lift" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{carrier.name}</CardTitle>
                    <CardDescription>{carrier.shortCode}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  A.M. Best: {carrier.amBestRating}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Turnaround</span>
                <Badge className={`text-xs ${getTurnaroundColor(carrier.turnaround)}`}>
                  {carrier.turnaround}
                </Badge>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Products</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {carrier.products.map(product => (
                    <Badge key={product} variant="secondary" className="text-xs">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Specialties</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {carrier.niches.map(niche => (
                    <Badge key={niche} variant="outline" className="text-xs">
                      {niche.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button size="sm" className="flex-1" asChild>
                  <a href={carrier.portalUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Portal
                  </a>
                </Button>
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <a href={carrier.quotesUrl} target="_blank" rel="noopener noreferrer">
                    Quotes
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCarriers.length === 0 && (
        <Card className="stat-card">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No carriers found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Carriers;