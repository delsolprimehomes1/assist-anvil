import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "slide-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(30px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "scale-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.9) rotateX(10deg)"
          },
          "100%": {
            opacity: "1",
            transform: "scale(1) rotateX(0deg)"
          }
        },
        "shimmer": {
          "0%": {
            transform: "translateX(-100%) rotateZ(45deg)"
          },
          "100%": {
            transform: "translateX(100%) rotateZ(45deg)"
          }
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)"
          },
          "50%": {
            boxShadow: "0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.2)"
          }
        },
        "float": {
          "0%, 100%": {
            transform: "translateY(0px) rotateX(0deg)"
          },
          "50%": {
            transform: "translateY(-10px) rotateX(2deg)"
          }
        },
        "card-hover": {
          "0%": {
            transform: "translateY(0) rotateX(0deg) rotateY(0deg)"
          },
          "100%": {
            transform: "translateY(-8px) rotateX(5deg) rotateY(5deg)"
          }
        },
        "bounce-3d": {
          "0%, 100%": {
            transform: "translateY(0) rotateX(0deg)"
          },
          "50%": {
            transform: "translateY(-5px) rotateX(5deg)"
          }
        },
        "magnetic": {
          "0%": {
            transform: "translateY(0) scale(1)"
          },
          "50%": {
            transform: "translateY(-2px) scale(1.02)"
          },
          "100%": {
            transform: "translateY(0) scale(1)"
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "slide-up": "slide-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "scale-in": "scale-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "shimmer": "shimmer 2s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "card-hover": "card-hover 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "bounce-3d": "bounce-3d 2s ease-in-out infinite",
        "magnetic": "magnetic 0.6s ease-in-out"
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;