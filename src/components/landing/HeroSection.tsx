import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  const scrollToForm = () => {
    const element = document.getElementById("contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[hsl(var(--accent-gold))]/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight">
          Your Complete Insurance Business{" "}
          <span className="text-primary">Command Center</span>
        </h1>
        
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          Access carriers, tools, training, and AI assistance — all in one powerful 
          platform built for modern insurance agents.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={scrollToForm}
            className="bg-[hsl(var(--accent-gold))] hover:bg-[hsl(var(--accent-gold-dark))] text-white min-w-[200px] text-lg h-14"
          >
            Get Started
            <ArrowDown className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[hsl(var(--success))] rounded-full" />
            <span>Trusted by 1,000+ agents</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span>No credit card required</span>
          </div>
        </div>
      </div>
    </section>
  );
};
