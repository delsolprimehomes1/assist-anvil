import { Link } from "react-router-dom";
import { Linkedin, Twitter } from "lucide-react";
import batterboxLogo from "@/assets/batterbox-logo.png";

export const LandingFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <img
              src={batterboxLogo}
              alt="BattersBox.ai"
              className="h-8 w-auto brightness-0 invert mb-4"
            />
            <p className="text-background/70 text-sm max-w-md">
              Your all-in-one platform for insurance carriers, quoting tools, training, 
              and AI assistance. Join thousands of agents transforming their business.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/70 hover:text-background transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/70 hover:text-background transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Contact
                </button>
              </li>
              <li>
                <Link to="/auth" className="text-background/70 hover:text-background transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy-policy" className="text-background/70 hover:text-background transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-background/70 hover:text-background transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Contact</h4>
              <a
                href="mailto:support@battersbox.ai"
                className="text-sm text-background/70 hover:text-background transition-colors"
              >
                support@battersbox.ai
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-background/60">
            <p>© {currentYear} BattersBox.ai. All rights reserved.</p>
            <p className="text-center md:text-right">
              Message and data rates may apply. Text STOP to opt-out.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
