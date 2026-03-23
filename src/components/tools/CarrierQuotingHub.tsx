import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  ExternalLink, 
  Lock, 
  Building2, 
  Calculator, 
  Globe,
  Zap,
  Shield,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

type LinkType = "quick-quote" | "agent-portal" | "microsite";

interface QuotingLink {
  id: string;
  carrier: string;
  name: string;
  url: string;
  type: LinkType;
  requires_login: boolean;
  description: string;
  gradient: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 }
  }
};

const getTypeConfig = (type: LinkType) => {
  switch (type) {
    case "quick-quote":
      return { label: "Quick Quote", icon: Zap, className: "bg-primary/10 text-primary border-primary/20" };
    case "agent-portal":
      return { label: "Agent Portal", icon: Shield, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
    case "microsite":
      return { label: "Microsite", icon: Globe, className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" };
  }
};

type FilterType = "all" | LinkType;

export const CarrierQuotingHub = () => {
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: quotingLinks = [], isLoading } = useQuery({
    queryKey: ["carrier-quoting-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carrier_quoting_links")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return (data as QuotingLink[]) ?? [];
    },
  });

  const filteredLinks = filter === "all" 
    ? quotingLinks 
    : quotingLinks.filter(link => link.type === filter);

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "quick-quote", label: "Quick Quotes" },
    { value: "agent-portal", label: "Agent Portals" },
    { value: "microsite", label: "Microsites" }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3 pb-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Calculator className="h-4 w-4" />
          Carrier Quoting Tools
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Quick Access to Quote Systems
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Direct links to carrier quoting portals and agent tools for fast client illustrations
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              filter === f.value
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filteredLinks.map((link) => {
            const typeConfig = getTypeConfig(link.type as LinkType);
            const TypeIcon = typeConfig.icon;

            return (
              <motion.a
                key={link.id}
                variants={cardVariants}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-xl border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${link.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground truncate">{link.carrier}</p>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{link.name}</h3>
                      </div>
                    </div>
                    {link.requires_login && (
                      <div className="p-1.5 rounded-md bg-amber-500/10 shrink-0">
                        <Lock className="h-3.5 w-3.5 text-amber-500" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{link.description}</p>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={`${typeConfig.className} text-xs flex items-center gap-1`}>
                      <TypeIcon className="h-3 w-3" />
                      {typeConfig.label}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      <span className="hidden sm:inline">Open</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-primary/0 group-hover:ring-primary/20 transition-all duration-300" />
              </motion.a>
            );
          })}
        </motion.div>
      )}

      {!isLoading && filteredLinks.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Links Found</h3>
          <p className="text-muted-foreground text-sm">Try selecting a different category</p>
        </div>
      )}

      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground">
          <Lock className="h-3 w-3 inline mr-1" />
          Links marked with a lock require agent credentials
        </p>
      </div>
    </div>
  );
};
