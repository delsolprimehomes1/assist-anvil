import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {/* Decorative gold accent */}
        <div className="flex justify-center mb-8">
          <div className="h-1.5 w-12 rounded-full bg-gold" />
        </div>

        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-foreground leading-[0.9] md:leading-[0.85]">
          Your Complete <br className="hidden sm:block" />
          Insurance Business <br className="hidden sm:block" />
          <span className="text-primary inline-block transform -rotate-1 italic">
            Command Center
          </span>
        </h1>

        <p className="font-body mt-10 text-lg sm:text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
          Access carriers, tools, training, and AI assistance —{" "}
          <br className="hidden sm:block" />
          <span className="font-medium text-foreground">all in one powerful platform</span>{" "}
          built for modern insurance agents.
        </p>

        <div className="mt-12 flex flex-col items-center gap-4">
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="font-body bg-gold hover:bg-gold-dark text-white px-10 py-6 h-auto text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>

          <div className="flex items-center gap-2 mt-4">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full border-2 border-background bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-bold">
                AI
              </div>
              <div className="h-8 w-8 rounded-full border-2 border-background bg-primary flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-primary-foreground animate-pulse" />
              </div>
            </div>
            <span className="font-body text-xs text-muted-foreground font-medium tracking-wide uppercase">
              System fully operational
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
