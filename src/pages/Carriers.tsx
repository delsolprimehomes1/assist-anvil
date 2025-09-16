import { useState } from "react";
import { Search, Filter, Building2, ExternalLink, Star, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CarrierDetailsModal from "@/components/CarrierDetailsModal";

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
    illustrationUrl: "https://illustrations.ag.com",
    headquarters: "175 Water Street, New York, NY 10038",
    phone: "1-800-225-5244",
    founded: 1960,
    employees: "45,000+",
    description: "American General Life Insurance Company is part of American International Group (AIG), one of the world's largest insurance organizations. We provide a broad range of life insurance and retirement products to individuals and businesses.",
    website: "https://www.aig.com",
    specialProducts: [
      "Term Life Insurance with conversion options",
      "Whole Life Insurance with flexible premiums", 
      "Final Expense Insurance with simplified underwriting",
      "Indexed Universal Life with market upside potential"
    ],
    underwritingStrengths: [
      "Competitive rates for smokers and diabetics",
      "Simplified underwriting for final expense products", 
      "Fast processing with electronic applications",
      "Liberal underwriting guidelines for standard risks"
    ],
    companyHistory: "Founded as part of AIG's expansion into life insurance, American General has been serving American families for over 60 years, building a reputation for financial stability and customer service excellence."
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
    illustrationUrl: "https://illustrations.moo.com",
    headquarters: "3300 Mutual of Omaha Plaza, Omaha, NE 68175",
    phone: "1-402-351-1685",
    founded: 1909,
    employees: "6,000+",
    description: "Mutual of Omaha is a Fortune 500 mutual company that has been helping secure the financial future of individuals, families and businesses for over 115 years. We focus on life insurance, annuities, and supplemental health products.",
    website: "https://www.mutualofomaha.com",
    specialProducts: [
      "Term Life Insurance up to age 80",
      "Guaranteed Issue Whole Life for seniors",
      "Final Expense coverage with graded benefits",
      "Fixed and indexed annuities for retirement planning"
    ],
    underwritingStrengths: [
      "Senior market expertise (ages 50-85)",
      "Guaranteed issue products available",
      "Fast approval process for simplified issue",
      "Strong financial ratings and stability"
    ],
    companyHistory: "Founded in 1909 as Mutual Benefit Health & Accident Association, Mutual of Omaha has grown to become one of America's most trusted insurance companies, famous for supporting families through life's uncertainties."
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
    illustrationUrl: "https://illustrations.foresters.com",
    headquarters: "789 Don Mills Road, Toronto, ON M3C 1T9, Canada",
    phone: "1-800-828-1540",
    founded: 1874,
    employees: "1,500+",
    description: "Foresters Financial is an international financial services provider with over 150 years of helping families achieve financial security. We offer life insurance and investment products with a focus on member benefits and community giving.",
    website: "https://www.foresters.com",
    specialProducts: [
      "Term Life Insurance with return of premium options",
      "Whole Life Insurance with participating dividends",
      "AcceleratedSM Underwriting for faster approvals",
      "Member benefits including scholarships and grants"
    ],
    underwritingStrengths: [
      "Accelerated underwriting with same-day decisions",
      "Competitive rates for healthy applicants",
      "Simplified application process",
      "Strong focus on family protection needs"
    ],
    companyHistory: "Founded in 1874 as the Independent Order of Foresters, we have been helping families do more of the good they want to do for over 150 years, combining insurance protection with member benefits and community support."
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
    illustrationUrl: "https://illustrations.americo.com",
    headquarters: "300 West 11th Street, Kansas City, MO 64105",
    phone: "1-800-231-6786",
    founded: 1947,
    employees: "800+",
    description: "Americo Financial Life and Annuity Insurance Company is dedicated to helping Americans achieve financial security through innovative life insurance and annuity products designed for today's market needs.",
    website: "https://www.americo.com",
    specialProducts: [
      "SimplicitySM Term Life with streamlined underwriting",
      "Whole Life Insurance with flexible payment options",
      "Final Expense coverage for burial and funeral costs",
      "Fixed and indexed annuities for retirement income"
    ],
    underwritingStrengths: [
      "Simplified underwriting for senior applicants",
      "Competitive rates for the 50+ market",
      "Fast processing with minimal requirements",
      "Expertise in final expense and burial insurance"
    ],
    companyHistory: "Founded in 1947, Americo has built a solid reputation for serving the insurance needs of American families, with particular expertise in products designed for older adults and retirees seeking affordable protection."
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
    illustrationUrl: "https://illustrations.fglife.com",
    headquarters: "601 Locust Street, Des Moines, IA 50309",
    phone: "1-855-800-7237",
    founded: 1959,
    employees: "1,200+",
    description: "F&G is a leading provider of annuity and life insurance solutions, helping Americans turn their aspirations into reality. We specialize in retirement planning products and innovative life insurance solutions.",
    website: "https://www.fglife.com",
    specialProducts: [
      "Fixed and indexed annuities for retirement income",
      "Term Life Insurance with competitive rates",
      "Indexed Universal Life with market participation",
      "Pension risk transfer solutions for institutions"
    ],
    underwritingStrengths: [
      "Leading annuity provider with competitive rates",
      "Innovative product design and features",
      "Strong financial backing from Fidelity National Financial",
      "Expertise in retirement and pension solutions"
    ],
    companyHistory: "Founded in 1959, F&G has evolved into a major player in the annuity market, becoming publicly traded in 2021 and continuing to innovate in retirement and life insurance solutions for American families."
  }
];

const Carriers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [selectedCarrier, setSelectedCarrier] = useState<typeof carriers[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedCarrier(carrier);
                    setIsModalOpen(true);
                  }}
                >
                  <Info className="h-3 w-3 mr-1" />
                  Details
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <a href={carrier.portalUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Portal
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

      <CarrierDetailsModal 
        carrier={selectedCarrier}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCarrier(null);
        }}
      />
    </div>
  );
};

export default Carriers;