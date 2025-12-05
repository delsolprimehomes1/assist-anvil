import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, DollarSign, Calculator, Heart, TrendingUp, Scale, TrendingDown, Users, Coffee, Wallet, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { LifeExpectancyCalculator } from "./LifeExpectancyCalculator";
import { LifetimeEarningsCalculator } from "./LifetimeEarningsCalculator";
import { InsuranceLongevityCalculator } from "./InsuranceLongevityCalculator";
import { CommissionCalculator } from "./CommissionCalculator";
import { DebtVsInvestingCalculator } from "./DebtVsInvestingCalculator";
import { InflationRetirementCalculator } from "./InflationRetirementCalculator";
import { PurchasingPowerCalculator } from "./PurchasingPowerCalculator";
import { SocialSecurityCalculator } from "./SocialSecurityCalculator";
import { InflationDamageCalculator } from "./InflationDamageCalculator";
import { HabitsWealthCalculator } from "./HabitsWealthCalculator";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const cashFlowCalculators = [
  {
    id: "debt-vs-investing",
    title: "Debt vs Investing",
    subtitle: "Should I pay debt or invest?",
    icon: Scale,
    gradient: "from-teal-500/20 to-cyan-500/5"
  },
  {
    id: "inflation-retirement",
    title: "Inflation Retirement",
    subtitle: "How does inflation change retirement?",
    icon: TrendingDown,
    gradient: "from-amber-500/20 to-yellow-500/5"
  },
  {
    id: "purchasing-power",
    title: "Purchasing Power",
    subtitle: "How inflation eats your money",
    icon: DollarSign,
    gradient: "from-rose-500/20 to-pink-500/5"
  }
];

const retirementCalculators = [
    {
      id: "social-security",
      title: "Social Security",
      subtitle: "Estimate my Social Security income",
      icon: Users,
      gradient: "from-indigo-500/20 to-purple-500/5"
    },
    {
      id: "inflation-damage",
      title: "Inflation Damage",
      subtitle: "How inflation changes retirement",
      icon: TrendingDown,
      gradient: "from-rose-500/20 to-orange-500/5"
    },
    {
      id: "habits-wealth",
      title: "Habits → Wealth",
      subtitle: "Turn spending into future wealth",
      icon: Coffee,
      gradient: "from-emerald-500/20 to-green-500/5"
    }
  ];

  const lifeCalculators = [
    {
      id: "life-expectancy",
      title: "Life Expectancy",
      subtitle: "Estimate your life expectancy",
      icon: Heart,
      gradient: "from-rose-500/20 to-pink-500/5"
    },
    {
      id: "lifetime-earnings",
      title: "Lifetime Earnings",
      subtitle: "Calculate total career earnings",
      icon: Wallet,
      gradient: "from-blue-500/20 to-cyan-500/5"
    },
    {
      id: "insurance-longevity",
      title: "Insurance Longevity",
      subtitle: "How long will coverage last?",
      icon: Shield,
      gradient: "from-emerald-500/20 to-teal-500/5"
    },
    {
      id: "commission",
      title: "Commission Calculator",
      subtitle: "Calculate agent commissions",
      icon: Calculator,
      gradient: "from-purple-500/20 to-purple-500/5"
    }
  ];

export const CalculatorHub = () => {
  const [category, setCategory] = useState<"cashflow" | "retirement" | "life">("cashflow");
  const [activeTab, setActiveTab] = useState("debt-vs-investing");

  const activeCalculators = category === "cashflow" ? cashFlowCalculators : category === "retirement" ? retirementCalculators : lifeCalculators;

  return (
    <div className="w-full">
      {/* Mobile-First Category Navigation with scroll indicator */}
      <div className="relative mb-6 sm:mb-8">
        <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide scroll-fade-right">
          <div className="flex gap-2 min-w-max pb-2">
            {[
              { id: "cashflow", label: "Cash Flow", icon: TrendingUp, defaultTab: "debt-vs-investing" },
              { id: "retirement", label: "Retirement", icon: Target, defaultTab: "social-security" },
              { id: "life", label: "Life & Income", icon: Heart, defaultTab: "life-expectancy" },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id as typeof category);
                    setActiveTab(cat.defaultTab);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all whitespace-nowrap min-h-[44px]",
                    "border text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card border-border hover:border-primary/50 hover:bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4 hidden sm:block" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
        {/* Fade indicator for mobile scroll */}
        <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
      </div>

      {/* Simplified Hero Sections */}
      <motion.div
        key={category}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        {category === "cashflow" && (
          <>
            <h2 className="text-xl sm:text-2xl font-bold mb-1 text-foreground">
              Cash Flow Intelligence
            </h2>
            <p className="text-sm text-muted-foreground">
              See what inflation steals — and what strategy protects
            </p>
          </>
        )}
        {category === "retirement" && (
          <>
            <h2 className="text-xl sm:text-2xl font-bold mb-1 text-foreground">
              Retirement Intelligence
            </h2>
            <p className="text-sm text-muted-foreground">
              Plan the life you want — not the one inflation leaves you
            </p>
          </>
        )}
        {category === "life" && (
          <>
            <h2 className="text-xl sm:text-2xl font-bold mb-1 text-foreground">
              Life & Income
            </h2>
            <p className="text-sm text-muted-foreground">
              Build trust through education — not pressure
            </p>
          </>
        )}
      </motion.div>

      {/* Mobile-First Calculator Grid */}
      <motion.div
        key={`grid-${category}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8"
      >
        {activeCalculators.map((calc) => {
          const Icon = calc.icon;
          const isActive = activeTab === calc.id;
          return (
            <motion.button
              key={calc.id}
              variants={cardVariants}
              onClick={() => setActiveTab(calc.id)}
              className={cn(
                "text-left rounded-xl p-4 sm:p-5 transition-all duration-200 min-h-[80px]",
                "bg-card border hover:shadow-md active:scale-[0.98]",
                isActive
                  ? "border-primary shadow-md ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  "bg-primary/10"
                )}>
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base mb-0.5 truncate">
                    {calc.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {calc.subtitle}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Calculator Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="hidden">
          {[...cashFlowCalculators, ...retirementCalculators, ...lifeCalculators].map((calc) => (
            <TabsTrigger key={calc.id} value={calc.id}>
              {calc.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Cash Flow Calculators */}
        <TabsContent value="debt-vs-investing" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <DebtVsInvestingCalculator />
          </motion.div>
        </TabsContent>

        <TabsContent value="inflation-retirement" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <InflationRetirementCalculator />
          </motion.div>
        </TabsContent>

        <TabsContent value="purchasing-power" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <PurchasingPowerCalculator />
          </motion.div>
        </TabsContent>

        {/* Retirement Calculators */}
        <TabsContent value="social-security" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <SocialSecurityCalculator />
          </motion.div>
        </TabsContent>

        <TabsContent value="inflation-damage" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <InflationDamageCalculator />
          </motion.div>
        </TabsContent>

        <TabsContent value="habits-wealth" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <HabitsWealthCalculator />
          </motion.div>
        </TabsContent>

        {/* Life & Income Calculators */}
        <TabsContent value="life-expectancy" className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LifeExpectancyCalculator />
          </motion.div>
        </TabsContent>

        <TabsContent value="lifetime-earnings" className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LifetimeEarningsCalculator />
          </motion.div>
        </TabsContent>

        <TabsContent value="insurance-longevity" className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <InsuranceLongevityCalculator />
          </motion.div>
        </TabsContent>

        <TabsContent value="commission" className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CommissionCalculator />
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <div className="mt-8 sm:mt-12 p-3 sm:p-4 bg-muted/30 rounded-lg border border-border">
        <p className="text-xs sm:text-sm text-muted-foreground text-center">
          {category === "cashflow" &&
            "Calculations are estimates based on standard models. Actual results vary by circumstances."}
          {category === "retirement" &&
            "All projections are estimates based on assumptions and averages. Outcomes vary depending on market conditions and personal factors."}
          {category === "life" &&
            "Estimates are based on averages and assumptions. Actual results vary. This tool is for educational purposes only — not financial advice. Always consult with a qualified financial professional for personalized guidance."}
        </p>
      </div>
    </div>
  );
};
