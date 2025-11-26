import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Briefcase, Shield, DollarSign, Calculator, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LifeExpectancyCalculator } from "./LifeExpectancyCalculator";
import { LifetimeEarningsCalculator } from "./LifetimeEarningsCalculator";
import { InsuranceLongevityCalculator } from "./InsuranceLongevityCalculator";
import { CommissionCalculator } from "./CommissionCalculator";

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

const calculators = [
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

export const CalculatorHub = () => {
  const [activeTab, setActiveTab] = useState("life-expectancy");

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 py-8"
      >
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
      </motion.div>

      {/* Calculator Grid Navigation */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {calculators.map((calc) => {
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
          {calculators.map((calc) => (
            <TabsTrigger key={calc.id} value={calc.id}>
              {calc.title}
            </TabsTrigger>
          ))}
        </TabsList>

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
          <strong>Disclaimer:</strong> Estimates are based on averages and assumptions. Actual results vary. 
          This tool is for educational purposes only — not financial advice. Always consult with a qualified 
          financial professional for personalized guidance.
        </p>
      </motion.div>
    </div>
  );
};