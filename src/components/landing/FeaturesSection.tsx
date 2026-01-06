import { Building2, Calculator, GraduationCap, Megaphone, Shield, Bot } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const features = [
  {
    icon: Building2,
    title: "Carriers",
    description: "Instant access to carrier information, underwriting guidelines, and product comparisons",
  },
  {
    icon: Calculator,
    title: "Quoting Tools",
    description: "Generate accurate quotes in seconds with our intelligent calculators",
  },
  {
    icon: GraduationCap,
    title: "Training",
    description: "Master your craft with expert-led courses and certification programs",
  },
  {
    icon: Megaphone,
    title: "Marketing",
    description: "Professional marketing materials ready to deploy for your agency",
  },
  {
    icon: Shield,
    title: "Compliance",
    description: "Stay ahead of regulations with automated compliance tracking",
  },
  {
    icon: Bot,
    title: "AI Assist",
    description: "Get instant answers and recommendations powered by AI",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Everything You Need to Succeed
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful tools and resources designed specifically for insurance professionals
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card className="brand-card h-full">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
