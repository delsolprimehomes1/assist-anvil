import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { LeadCaptureForm } from "@/components/landing/LeadCaptureForm";
import { LandingFooter } from "@/components/landing/LandingFooter";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main className="pt-16">
        <HeroSection />
        <FeaturesSection />
        <LeadCaptureForm />
      </main>
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
