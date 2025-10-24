import { useState } from "react";
import { ExternalLink, Download, ChevronDown, ChevronUp, Star, Shield, Clock, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CarrierLogo } from "./CarrierLogo";
import { cn } from "@/lib/utils";

interface Carrier {
  id: number;
  name: string;
  shortCode: string;
  amBestRating: string;
  products: string[];
  niches: string[];
  turnaround: string;
  description: string;
  portalUrl: string;
  underwritingGuideUrl?: string;
  founded?: number;
}

interface CarrierCardProps {
  carrier: Carrier;
  onViewDetails: () => void;
  onDownload?: (url: string, filename: string) => void;
}

const productColors: Record<string, string> = {
  Term: "bg-orange-500 text-white hover:bg-orange-600",
  WL: "bg-blue-500 text-white hover:bg-blue-600",
  FE: "bg-purple-500 text-white hover:bg-purple-600",
  Annuity: "bg-emerald-500 text-white hover:bg-emerald-600",
  IUL: "bg-rose-500 text-white hover:bg-rose-600",
};

const ratingColors: Record<string, string> = {
  "A+": "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400",
  A: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400",
  "A-": "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
  "B++": "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
  "B+": "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400",
  B: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const turnaroundConfig: Record<string, { label: string; icon: any; color: string }> = {
  fast: { label: "Fast", icon: Zap, color: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400" },
  avg: { label: "Average", icon: Clock, color: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400" },
  slow: { label: "Slow", icon: TrendingUp, color: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400" },
};

const nicheLabels: Record<string, string> = {
  senior: "Senior Market",
  final_expense: "Final Expense",
  high_net_worth: "High Net Worth",
  simplified_issue: "Simplified Issue",
  digital: "Digital Platform",
  mutual_company: "Mutual Company",
  impaired_risk: "Impaired Risk",
  no_exam: "No Exam",
};

export function CarrierCard({ carrier, onViewDetails, onDownload }: CarrierCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const turnaround = turnaroundConfig[carrier.turnaround] || turnaroundConfig.avg;
  const TurnaroundIcon = turnaround.icon;
  
  const ratingColor = ratingColors[carrier.amBestRating] || "bg-muted text-muted-foreground border-border";

  return (
    <Card className="group hover-lift overflow-hidden transition-all duration-300 hover:shadow-lg h-full flex flex-col">
      {/* Mobile Compact Header (< 768px) */}
      <div className="md:hidden">
        <CardContent className="p-4 space-y-3">
          {/* Top Row: Logo + Name + Rating */}
          <div className="flex items-start gap-3">
            <CarrierLogo
              name={carrier.name}
              shortCode={carrier.shortCode}
              className="w-14 h-14 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{carrier.name}</h3>
              <p className="text-xs text-muted-foreground">{carrier.shortCode}</p>
            </div>
            <Badge variant="outline" className={cn("flex items-center gap-1 flex-shrink-0", ratingColor)}>
              <Star className="h-3 w-3" />
              {carrier.amBestRating}
            </Badge>
          </div>

          {/* Product Badges + Turnaround */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {carrier.products.slice(0, 4).map((product) => (
              <Badge
                key={product}
                className={cn("text-xs px-2 py-0.5", productColors[product] || "bg-muted text-muted-foreground")}
              >
                {product}
              </Badge>
            ))}
            <Badge variant="outline" className={cn("flex items-center gap-1 text-xs", turnaround.color)}>
              <TurnaroundIcon className="h-3 w-3" />
              {turnaround.label}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => window.open(carrier.portalUrl, "_blank")}
              className="flex-1 h-9"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Portal
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-1 h-9"
            >
              Details
              {isExpanded ? (
                <ChevronUp className="h-3 w-3 ml-1" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-1" />
              )}
            </Button>
          </div>

          {/* Expandable Details on Mobile */}
          {isExpanded && (
            <div className="pt-3 border-t space-y-2 animate-fade-in">
              <p className="text-sm text-muted-foreground line-clamp-3">{carrier.description}</p>
              {carrier.niches.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {carrier.niches.slice(0, 3).map((niche) => (
                    <Badge key={niche} variant="outline" className="text-xs">
                      {nicheLabels[niche] || niche}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={onViewDetails} className="flex-1">
                  Full Details
                </Button>
                {carrier.underwritingGuideUrl && onDownload && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDownload(carrier.underwritingGuideUrl!, `${carrier.shortCode}_Guide.pdf`)}
                    className="flex-1"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Guide
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </div>

      {/* Desktop Card (≥ 768px) */}
      <div className="hidden md:block h-full">
        <CardContent className="p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <CarrierLogo
              name={carrier.name}
              shortCode={carrier.shortCode}
              className="w-16 h-16 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1 truncate group-hover:text-primary transition-colors">
                {carrier.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{carrier.shortCode}</span>
                {carrier.founded && (
                  <>
                    <span>•</span>
                    <span>Est. {carrier.founded}</span>
                  </>
                )}
              </div>
            </div>
            <Badge variant="outline" className={cn("flex items-center gap-1.5 px-3 py-1", ratingColor)}>
              <Star className="h-3.5 w-3.5" />
              {carrier.amBestRating}
            </Badge>
          </div>

          {/* Product Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {carrier.products.map((product) => (
              <Badge
                key={product}
                className={cn("px-3 py-1", productColors[product] || "bg-muted text-muted-foreground")}
              >
                {product}
              </Badge>
            ))}
            <Badge variant="outline" className={cn("flex items-center gap-1.5", turnaround.color)}>
              <TurnaroundIcon className="h-3.5 w-3.5" />
              {turnaround.label}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-grow">
            {carrier.description}
          </p>

          {/* Specialties */}
          {carrier.niches.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {carrier.niches.slice(0, 3).map((niche) => (
                <Badge key={niche} variant="outline" className="text-xs">
                  {nicheLabels[niche] || niche}
                </Badge>
              ))}
              {carrier.niches.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{carrier.niches.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <Button
              size="sm"
              onClick={() => window.open(carrier.portalUrl, "_blank")}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Portal
            </Button>
            <Button size="sm" variant="secondary" onClick={onViewDetails} className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Details
            </Button>
            {carrier.underwritingGuideUrl && onDownload && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDownload(carrier.underwritingGuideUrl!, `${carrier.shortCode}_Guide.pdf`)}
                className="col-span-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Underwriting Guide
              </Button>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
