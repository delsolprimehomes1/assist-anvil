import { useState, useEffect } from "react";
import { Search, Filter, Building2, ExternalLink, Star, Info, Download, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CarrierDetailsModal from "@/components/CarrierDetailsModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const hardcodedCarriers = [
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
  },
  {
    id: 6,
    name: "Ethos",
    shortCode: "ETH",
    amBestRating: "N/A",
    products: ["Term", "WL", "FE", "IUL"],
    niches: ["fast_approval", "digital", "no_exam"],
    turnaround: "fast",
    logoUrl: "/carriers/ethos.png",
    portalUrl: "https://agent.ethoslife.com",
    quotesUrl: "https://quotes.ethoslife.com",
    illustrationUrl: "https://illustrations.ethoslife.com",
    headquarters: "101 Montgomery Street, San Francisco, CA 94104",
    phone: "1-415-887-1477",
    founded: 2016,
    employees: "200+",
    description: "Ethos is a modern insurtech platform revolutionizing life insurance with instant approvals and a fully digital experience. We partner with highly-rated carriers to offer fast, affordable coverage without medical exams.",
    website: "https://www.ethoslife.com",
    specialProducts: [
      "Instant Term Life Insurance up to $2M without medical exam",
      "Whole Life Insurance with simplified underwriting",
      "Final Expense coverage with same-day approval",
      "Indexed Universal Life with flexible premiums"
    ],
    underwritingStrengths: [
      "AI-powered instant underwriting decisions",
      "No medical exam required for most applicants",
      "Same-day approval for qualified applicants",
      "100% digital application process",
      "Partners with A and A+ rated carriers"
    ],
    companyHistory: "Founded in 2016, Ethos pioneered the use of technology and data science to make life insurance accessible and instant. As a digital-first platform partnering with established carriers, Ethos has helped thousands of families get covered in minutes rather than weeks.",
    underwritingGuideUrl: "/carriers/ethos-underwriting-guide.pdf"
  },
  {
    id: 7,
    name: "TruStage",
    shortCode: "TS",
    amBestRating: "A",
    products: ["Term", "WL", "FE", "Annuity"],
    niches: ["senior", "credit_union", "member_benefits"],
    turnaround: "avg",
    logoUrl: "/carriers/trustage.png",
    portalUrl: "https://agent.trustage.com",
    quotesUrl: "https://quotes.trustage.com",
    illustrationUrl: "https://illustrations.trustage.com",
    headquarters: "5910 Mineral Point Road, Madison, WI 53705",
    phone: "1-800-356-2644",
    founded: 1935,
    employees: "1,000+",
    description: "TruStage is the marketing name for TruStage Financial Group, Inc., and its subsidiaries. We provide insurance and financial solutions exclusively through credit unions, helping members protect what matters most.",
    website: "https://www.trustage.com",
    specialProducts: [
      "Term Life Insurance available through credit unions",
      "Whole Life Insurance with member benefits",
      "Final Expense coverage with simplified underwriting",
      "Accidental Death & Dismemberment Insurance"
    ],
    underwritingStrengths: [
      "Exclusive credit union distribution channel",
      "Simplified underwriting for credit union members",
      "Competitive rates for qualified members",
      "Strong focus on member financial wellness"
    ],
    companyHistory: "Founded in 1935 as CUNA Mutual Group, TruStage has been the trusted insurance partner of credit unions for nearly 90 years, helping millions of credit union members achieve financial security.",
    underwritingGuideUrl: "/carriers/trustage-underwriting-guide.pdf"
  },
  {
    id: 8,
    name: "Royal Neighbors of America",
    shortCode: "RNA",
    amBestRating: "A",
    products: ["FE", "Term", "WL"],
    niches: ["senior", "final_expense", "women_focused"],
    turnaround: "avg",
    logoUrl: "/carriers/rna.png",
    portalUrl: "https://www.royalneighbors.org",
    quotesUrl: "https://quotes.royalneighbors.org",
    illustrationUrl: "https://illustrations.royalneighbors.org",
    headquarters: "230 16th Street, Rock Island, IL 61201",
    phone: "1-800-627-4762",
    founded: 1895,
    employees: "500+",
    description: "Royal Neighbors of America is one of the nation's largest women-led insurance organizations, founded to help protect women and families. We specialize in life insurance and annuity products with a focus on empowering women through financial security and community support.",
    website: "https://www.royalneighbors.org",
    specialProducts: [
      "Ensured Legacy Final Expense Insurance",
      "Term Life Insurance for family protection",
      "Whole Life Insurance with guaranteed benefits",
      "Women-focused member benefits and programs"
    ],
    underwritingStrengths: [
      "Specialized in final expense insurance market",
      "Simplified underwriting for senior applicants",
      "130+ years of serving American families",
      "Strong focus on women and family protection",
      "Competitive rates for ages 50-85"
    ],
    companyHistory: "Founded in 1895 as one of the first fraternal benefit societies for women, Royal Neighbors of America has been empowering women and protecting families for over 130 years. Based in Rock Island, Illinois, we continue our mission of helping members achieve financial security while giving back to communities.",
    underwritingGuideUrl: "/carriers/royal-neighbors-training-guide.pdf"
  },
  {
    id: 9,
    name: "Continental General",
    shortCode: "CG",
    amBestRating: "B+",
    products: ["FE"],
    niches: ["senior", "final_expense", "simplified_issue"],
    turnaround: "fast",
    logoUrl: "/carriers/cg.png",
    portalUrl: "https://cgic.com",
    quotesUrl: "https://quotes.cgic.com",
    illustrationUrl: "https://illustrations.cgic.com",
    underwritingGuideUrl: "/carriers/newbridge-producer-guide.pdf",
    headquarters: "Austin, TX",
    phone: "1-800-123-4567",
    founded: 1950,
    employees: "500+",
    description: "Continental General Insurance Company (CGIC) is a stock life, accident and health insurance company licensed in forty-nine states, the District of Columbia, and the U.S. Virgin Islands. Their flagship NewBridge Final Expense product features 100% digital applications with instant decisions in most cases, making it easy to provide affordable coverage for funeral and end-of-life expenses.",
    website: "https://cgic.com",
    specialProducts: [
      "NewBridge Final Expense - 100% digital with instant decisions",
      "Ages 50-85 | Coverage $2,000-$35,000",
      "Level or Modified Death Benefit options",
      "No medical exam required",
      "Optional Accidental Death Benefit Rider",
      "Optional Accelerated Death Benefit Rider for Terminal Illness"
    ],
    underwritingStrengths: [
      "Instant approval decisions in majority of cases",
      "100% digital eApp process with eConsent and eSignature",
      "No medical exam - simplified underwriting",
      "Robust field underwriting information built into eApp",
      "Licensed in 49 states, DC, and US Virgin Islands",
      "Ages 50-85 with coverage up to $35,000"
    ],
    companyHistory: "Continental General Insurance Company is part of the Continental Insurance Group, providing life, accident, and health insurance solutions to American families. Their NewBridge Final Expense product revolutionizes the final expense market with intelligent, data-driven underwriting and a seamless digital application process that delivers instant decisions."
  },
  {
    id: 10,
    name: "Baltimore Life",
    shortCode: "BL",
    amBestRating: "B++",
    products: ["WL", "FE", "Term"],
    niches: ["senior", "final_expense", "mutual_company"],
    turnaround: "avg",
    logoUrl: "/carriers/bl.png",
    portalUrl: "https://www.baltlife.com/experienced-agents",
    quotesUrl: "https://www.baltlife.com/iProvideQuote/default.aspx",
    illustrationUrl: "https://www.baltlife.com/product-portfolio",
    underwritingGuideUrl: "/carriers/baltimore-life-apriority-guide.pdf",
    headquarters: "10075 Red Run Boulevard, Owings Mills, MD 21117",
    phone: "1-800-628-5433",
    founded: 1882,
    employees: "500+",
    description: "Baltimore Life Insurance Company is a mutual life insurance company with over 140 years of history serving American families. As a mutual insurer owned by policyholders, Baltimore Life prioritizes long-term stability and customer value, offering whole life, term life, and final expense products.",
    website: "https://www.baltlife.com",
    specialProducts: [
      "A Priority WL - Whole Life Final Expense Insurance",
      "Senior Life coverage for ages 45-89",
      "Single Premium Whole Life",
      "Generation Legacy whole life products",
      "INSpeed® point-of-sale underwriting decisions"
    ],
    underwritingStrengths: [
      "A Priority WL product for final expense market",
      "INSpeed® NOW and INSpeed® Plus instant decisions",
      "Simplified underwriting for seniors (45-89)",
      "Coverage from $2,500 to $50,000",
      "Mutual company structure focused on policyholders",
      "Licensed in 49 states and DC"
    ],
    companyHistory: "Founded in 1882, Baltimore Life has been serving the middle market for over 140 years. As a mutual insurance company owned by its policyholders rather than shareholders, Baltimore Life maintains a strong reputation for integrity, financial stability, and exceptional service to both agents and policyholders."
  },
  {
    id: 11,
    name: "Assurity",
    shortCode: "ASS",
    amBestRating: "A-",
    products: ["Term", "WL", "FE"],
    niches: ["fast_approval", "accelerated_underwriting", "digital"],
    turnaround: "fast",
    logoUrl: "/carriers/assurity.png",
    portalUrl: "https://www.assurity.com",
    quotesUrl: "https://www.assurity.com/agent-resources",
    illustrationUrl: "https://www.assurity.com/product-illustrations",
    underwritingGuideUrl: "/carriers/assurity-term-underwriting-guide.pdf",
    headquarters: "2000 Q Street, Lincoln, NE 68503",
    phone: "1-800-276-7619",
    founded: 1890,
    employees: "600+",
    description: "Assurity Life Insurance Company is a mutual holding company with over 130 years of experience providing life insurance and related financial products. Assurity specializes in term life insurance with accelerated underwriting options, offering fast approvals and simplified processes for agents and consumers.",
    website: "https://www.assurity.com",
    specialProducts: [
      "Term Life Insurance with Accelerated Underwriting (AUW)",
      "Whole Life Insurance with flexible premiums",
      "Final Expense coverage with simplified issue",
      "Disability Income Insurance for income protection",
      "AcceleratedSM Underwriting for same-day decisions"
    ],
    underwritingStrengths: [
      "Accelerated Underwriting (AUW) - no medical exam up to certain limits",
      "Same-day decisions for qualified applicants",
      "Preferred Plus rates available for healthy applicants",
      "Ages 18-70 for term life products",
      "Height/weight requirements more liberal than industry standard",
      "Strong financial ratings (A.M. Best A-)",
      "Licensed in all states except New York"
    ],
    companyHistory: "Founded in 1890 as the Bankers Life Association, Assurity has evolved into a trusted provider of life insurance and disability products. As a mutual holding company based in Lincoln, Nebraska, Assurity focuses on providing innovative insurance solutions with a strong emphasis on accelerated underwriting and digital processes to serve modern agents and consumers."
  },
  {
    id: 12,
    name: "North American",
    shortCode: "NAC",
    amBestRating: "A+",
    products: ["Term", "WL", "IUL", "FE"],
    niches: ["preferred", "financial_underwriting", "high_net_worth"],
    turnaround: "avg",
    logoUrl: "/carriers/north-american.png",
    portalUrl: "https://www.nacolah.com/producer",
    quotesUrl: "https://www.nacolah.com/products",
    illustrationUrl: "https://www.nacolah.com/illustrations",
    underwritingGuideUrl: "/carriers/north-american-underwriting-guidelines.pdf",
    headquarters: "525 W. Van Buren St., Chicago, IL 60607",
    phone: "1-877-645-5433",
    founded: 1886,
    employees: "1,500+",
    description: "North American Company for Life and Health Insurance® is a member of Sammons Financial Group®. With over 135 years of experience, North American uses a common sense approach to underwriting, offering competitive life insurance products with a holistic evaluation process that balances favorable and unfavorable risk factors on a case-by-case basis.",
    website: "https://www.nacolah.com",
    specialProducts: [
      "Indexed Universal Life with market-linked growth potential",
      "Term Life with competitive preferred rates",
      "Whole Life with flexible premium options",
      "Final Expense with simplified underwriting",
      "WriteAway® Accelerated Underwriting for fast decisions",
      "SimpleSubmit® electronic application system"
    ],
    underwritingStrengths: [
      "Common sense holistic underwriting approach",
      "Super Preferred and Preferred rate classes available",
      "Competitive financial underwriting guidelines",
      "Liberal build charts for height/weight requirements",
      "WriteAway® accelerated underwriting program",
      "SimpleSubmit® electronic application process",
      "Case-by-case risk factor evaluation",
      "Preferred cancer case consideration",
      "Experienced underwriting team with medical expertise"
    ],
    companyHistory: "Founded in 1886, North American Company for Life and Health Insurance® has over 135 years of experience serving American families. As a member of Sammons Financial Group®, North American maintains strong financial stability with an A.M. Best A+ rating. The company is known for its innovative products, competitive underwriting, and commitment to making it easy for agents to do business."
  },
  {
    id: 13,
    name: "American Amicable",
    shortCode: "AAIC",
    amBestRating: "A-",
    products: ["WL", "FE", "IUL", "Term"],
    niches: ["final_expense", "simplified_issue", "senior_market", "term_life"],
    turnaround: "fast",
    logoUrl: "/carriers/american-amicable.png",
    portalUrl: "https://www.insuranceapplication.com",
    quotesUrl: "https://www.aatx.com/agent-portal",
    illustrationUrl: "https://www.aatx.com/illustrations",
    underwritingGuideUrl: "/carriers/american-amicable-senior-choice-guide.pdf",
    iulGuideUrl: "/carriers/american-amicable-intelligent-choice-iul-guide.pdf",
    termGuideUrl: "/carriers/american-amicable-safecare-term-guide.pdf",
    termMsGuideUrl: "/carriers/american-amicable-term-ms-guide.pdf",
    headquarters: "425 Austin Ave., Waco, TX 76701",
    phone: "1-800-736-7311",
    founded: 1910,
    employees: "500+",
    description: "American Amicable Life Insurance Company offers a comprehensive portfolio including final expense, indexed universal life, and term life insurance products. Their flagship products include Senior Choice whole life (ages 50-85), Intelligent Choice IUL (ages 18-75), and SafeCare Term (ages 18-80+), all featuring modern underwriting with point-of-sale decision capabilities.",
    website: "https://www.aatx.com",
    specialProducts: [
      "Senior Choice Immediate Death Benefit (ages 50-85)",
      "Senior Choice Graded Death Benefit (graded payout)",
      "Senior Choice Return of Premium Benefit (ROP with interest)",
      "Intelligent Choice IUL (ages 18-75) with indexed growth",
      "IUL Multiple Index Options (S&P 500, Fixed Account)",
      "SafeCare Term - Level Term to age 95 (10, 15, 20, 30-year terms)",
      "Term Made Simple (Term MS) - Level Term to age 95",
      "SafeCare Term with Return of Premium option available",
      "Mobile Application with instant decision engine",
      "Grandchild Rider covering great-grandchildren",
      "Terminal Illness Accelerated Death Benefit (no-cost rider)",
      "Nursing Home Waiver of Premium Rider"
    ],
    underwritingStrengths: [
      "Simplified issue (Senior Choice: 8 Yes/No questions)",
      "IUL simplified underwriting (ages 18-75)",
      "Full underwriting with competitive term rates (SafeCare Term)",
      "Point-of-sale underwriting decisions via mobile app",
      "Liberal build charts for all age ranges",
      "Senior market specialist (ages 50-85 for FE)",
      "Indexed growth potential with downside protection (IUL)",
      "Term coverage to age 95 with convertibility options",
      "Face amounts from $2,500 to $1,000,000 (product dependent)",
      "Three Senior Choice plan options for different health profiles",
      "No phone interview for ages 50-70 (Senior Choice)",
      "Fast prescription database check process",
      "Living benefits riders available on IUL and Term products"
    ],
    companyHistory: "American Amicable Life Insurance Company has been serving American families for over a century with a focus on accessible, affordable life insurance. Based in Waco, Texas, American Amicable specializes in the final expense and senior life insurance markets, offering innovative simplified issue products with modern technology including mobile applications and point-of-sale decision engines that make it easy for agents to serve clients quickly."
  }
];

const Carriers = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [selectedCarrier, setSelectedCarrier] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCarriers();
  }, []);

  const transformCarrierForModal = (carrier: any) => {
    return {
      id: carrier.id,
      name: carrier.name,
      shortCode: carrier.short_code,
      amBestRating: carrier.am_best_rating,
      products: carrier.products || [],
      niches: carrier.niches || [],
      turnaround: carrier.turnaround,
      logoUrl: carrier.logo_url,
      portalUrl: carrier.portal_url || '',
      quotesUrl: carrier.quotes_url || '',
      illustrationUrl: carrier.illustration_url || '',
      headquarters: carrier.headquarters || '',
      phone: carrier.phone || '',
      founded: carrier.founded || '',
      employees: carrier.employees || '',
      description: carrier.description || '',
      website: carrier.website || '',
      specialProducts: carrier.special_products || [],
      underwritingStrengths: carrier.underwriting_strengths || [],
      companyHistory: carrier.company_history || ''
    };
  };

  const fetchCarriers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCarriers(data || []);
    } catch (error: any) {
      console.error('Error fetching carriers:', error);
      toast({
        title: "Error",
        description: "Failed to load carriers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Downloading ${filename}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Unable to download file",
        variant: "destructive",
      });
    }
  };

  const filteredCarriers = carriers.filter(carrier => {
    const matchesSearch = carrier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         carrier.short_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = selectedProduct === "all" || carrier.products?.includes(selectedProduct);
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

      {loading ? (
        <div className="text-center py-12">Loading carriers...</div>
      ) : carriers.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Carriers Available</h3>
          <p className="text-muted-foreground">Check back soon as we add carriers to the system.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCarriers.map((carrier, index) => (
            <Card key={carrier.id} className="stat-card hover-lift" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {carrier.logo_url ? (
                      <img src={carrier.logo_url} alt={carrier.name} className="w-12 h-12 object-contain" />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{carrier.name}</CardTitle>
                      <CardDescription>{carrier.short_code}</CardDescription>
                    </div>
                  </div>
                  {carrier.am_best_rating && (
                    <Badge variant="outline" className="text-xs">
                      A.M. Best: {carrier.am_best_rating}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {carrier.turnaround && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Turnaround</span>
                    <Badge className={`text-xs ${getTurnaroundColor(carrier.turnaround)}`}>
                      {carrier.turnaround}
                    </Badge>
                  </div>
                )}

                {carrier.products && carrier.products.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Products</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {carrier.products.map((product: string) => (
                        <Badge key={product} variant="secondary" className="text-xs">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {carrier.niches && carrier.niches.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Specialties</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {carrier.niches.map((niche: string) => (
                        <Badge key={niche} variant="outline" className="text-xs">
                          {niche.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Primary action buttons */}
                <div className="grid grid-cols-2 gap-2 pt-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-10 md:h-9"
                    onClick={() => {
                      setSelectedCarrier(transformCarrierForModal(carrier));
                      setIsModalOpen(true);
                    }}
                  >
                    <Info className="h-4 w-4 md:h-3 md:w-3 mr-1" />
                    <span className="text-sm">Details</span>
                  </Button>
                  {carrier.portal_url && (
                    <Button size="sm" asChild>
                      <a href={carrier.portal_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Portal
                      </a>
                    </Button>
                  )}
                </div>

                {/* PDF download buttons - full width on mobile for better text display */}
                {carrier.pdf_documents && carrier.pdf_documents.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {carrier.pdf_documents.map((pdf: any, pdfIndex: number) => (
                      <Button 
                        key={pdfIndex}
                        size="sm" 
                        variant="secondary" 
                        className="text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
                        onClick={() => handleDownload(pdf.url, pdf.title)}
                      >
                        <Download className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="overflow-hidden text-ellipsis">{pdf.button_label || pdf.name || 'Download'}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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