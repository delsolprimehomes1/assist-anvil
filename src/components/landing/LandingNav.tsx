import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import batterboxLogo from "@/assets/batterbox-logo.png";

export const LandingNav = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={batterboxLogo} alt="BattersBox.ai" className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection("features")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </button>
            <Link to="/privacy-policy">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </span>
            </Link>
            <Link to="/auth">
              <Button variant="default" size="sm">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection("features")}
                className="text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-2"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-2"
              >
                Contact
              </button>
              <Link to="/privacy-policy" onClick={() => setMobileMenuOpen(false)}>
                <span className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-2">
                  Privacy
                </span>
              </Link>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="default" size="sm" className="w-full">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
