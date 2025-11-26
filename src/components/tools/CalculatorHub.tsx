import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Briefcase, Shield, DollarSign, Calculator, Info, CreditCard, Heart, TrendingUp, Scale, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LifeExpectancyCalculator } from "./LifeExpectancyCalculator";
import { LifetimeEarningsCalculator } from "./LifetimeEarningsCalculator";
import { InsuranceLongevityCalculator } from "./InsuranceLongevityCalculator";
import { CommissionCalculator } from "./CommissionCalculator";
import { DebtVsInvestingCalculator } from "./DebtVsInvestingCalculator";
import { InflationRetirementCalculator } from "./InflationRetirementCalculator";
import { PurchasingPowerCalculator } from "./PurchasingPowerCalculator";
import { CreditCardPayoffCalculator } from "./CreditCardPayoffCalculator";
import { LoanPayoffCalculator } from "./LoanPayoffCalculator";
import { LoanPaymentCalculator } from "./LoanPaymentCalculator";
import { BalanceEstimatorCalculator } from "./BalanceEstimatorCalculator";

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

const debtCalculators = [
  {
    id: "credit-card-payoff",
    title: "Credit Card Payoff",
    subtitle: "When will I be debt-free?",
    icon: CreditCard,
    gradient: "from-red-500/20 to-orange-500/5"
  },
  {
    id: "loan-payoff",
    title: "Loan Payoff Timeline",
    subtitle: "How long until my loan is paid off?",
    icon: Clock,
    gradient: "from-blue-500/20 to-cyan-500/5"
  },
  {
    id: "loan-payment",
    title: "Loan Payment Estimator",
    subtitle: "What will my loan payment be?",
    icon: Calculator,
    gradient: "from-purple-500/20 to-pink-500/5"
  },
  {
    id: "balance-estimator",
    title: "Balance Estimator",
    subtitle: "What's my actual loan balance?",
    icon: DollarSign,
    gradient: "from-green-500/20 to-emerald-500/5"
  }
];

const lifeCalculators = [
  {
    id: "life-expectancy",
    title: "Life Expectancy",
    subtitle: "How long am I likely to live?",
    icon: Clock,
    gradient: "from-primary/20 to-primary/5"
  },
  {
    id: "lifetime-earnings",
    title: "Lifetime Earnings",
    subtitle: "How much will I earn in my lifetime?",
    icon: Briefcase,
    gradient: "from-success/20 to-success/5"
  },
  {
    id: "insurance-longevity",
    title: "Insurance Longevity",
    subtitle: "How long would your insurance last?",
    icon: Shield,
    gradient: "from-accent-gold/20 to-accent-gold/5"
  },
  {
    id: "commission",
    title: "Commission Estimator",
    subtitle: "Advanced agent commission calculator",
    icon: DollarSign,
    gradient: "from-secondary/40 to-secondary/10"
  }
];

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

export const CalculatorHub = () => {
  const [category, setCategory] = useState<"debt" | "cashflow" | "life">("debt");
  const [activeTab, setActiveTab] = useState("credit-card-payoff");

  const activeCalculators = category === "debt" ? debtCalculators : category === "cashflow" ? cashFlowCalculators : lifeCalculators;

  return (
    <div className="space-y-8">
      {/* Category Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-lg bg-muted">
          <button
            onClick={() => {
              setCategory("debt");
              setActiveTab("credit-card-payoff");
            }}
            className={`
              inline-flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all
              ${category === "debt" 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            <CreditCard className="h-4 w-4" />
            Credit & Debt
          </button>
          <button
            onClick={() => {
              setCategory("cashflow");
              setActiveTab("debt-vs-investing");
            }}
            className={`
              inline-flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all
              ${category === "cashflow" 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            <TrendingUp className="h-4 w-4" />
            Cash Flow
          </button>
          <button
            onClick={() => {
              setCategory("life");
              setActiveTab("life-expectancy");
            }}
            className={`
              inline-flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all
              ${category === "life" 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            <Heart className="h-4 w-4" />
            Life & Income
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <motion.div
        key={category}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 py-8"
      >
        {category === "debt" ? (
          <>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
              <CreditCard className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">Debt Control</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Credit & Debt Command Center
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See your debt. Control it. Destroy it.
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto italic">
              Four calculators that tell you the truth — not what banks hope you never look at.
            </p>
          </>
        ) : category === "cashflow" ? (
          <>
            <Badge className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30 mb-4">
              <TrendingUp className="h-3 w-3 mr-1" />
              Cash Flow Intelligence
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Cash Flow Intelligence Hub
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Where money decisions stop being guesses and start being strategy.
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto italic">
              These calculators expose where money goes — and where it should.
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Calculator className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Financial Tools</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent-gold to-primary bg-clip-text text-transparent">
              Financial Clarity Center
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Instant calculators that turn confusion into confidence.
            </p>
          </>
        )}
      </motion.div>

      {/* Calculator Grid Navigation */}
      <motion.div
        key={`grid-${category}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {activeCalculators.map((calc) => {
          const Icon = calc.icon;
          return (
            <motion.button
              key={calc.id}
              variants={cardVariants}
              onClick={() => setActiveTab(calc.id)}
              className={`
                glass-card p-6 text-left transition-all duration-300 cursor-pointer
                hover:shadow-lg hover:-translate-y-1
                ${activeTab === calc.id ? 'ring-2 ring-primary shadow-lg' : ''}
              `}
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${calc.gradient} flex items-center justify-center mb-4`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-1">{calc.title}</h3>
              <p className="text-sm text-muted-foreground">{calc.subtitle}</p>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Calculator Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="hidden">
          {[...debtCalculators, ...lifeCalculators].map((calc) => (
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

        {/* Debt Calculators */}
        <TabsContent value="credit-card-payoff" className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CreditCardPayoffCalculator />
          </motion.div>
        </TabsContent>

        <TabsContent value="loan-payoff" className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoanPayoffCalculator />
          </motion.div>
        </TabsContent>

        <TabsContent value="loan-payment" className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoanPaymentCalculator />
          </motion.div>
        </TabsContent>

        <TabsContent value="balance-estimator" className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BalanceEstimatorCalculator />
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border"
      >
        <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong>Disclaimer:</strong> {category === "debt" 
            ? "These calculations are for educational purposes only and estimates are based on assumptions. Exact figures vary based on lender disclosures and circumstances." 
            : category === "cashflow"
            ? "Calculations are estimates based on standard models. Actual results vary by circumstances."
            : "Estimates are based on averages and assumptions. Actual results vary. This tool is for educational purposes only — not financial advice. Always consult with a qualified financial professional for personalized guidance."
          }
        </p>
      </motion.div>
    </div>
  );
};