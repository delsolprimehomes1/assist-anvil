import { TrendingUp, DollarSign, Target, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const stats = [
  {
    title: "Policies This Month",
    value: "24",
    change: "+12%",
    trend: "up",
    icon: Target,
    description: "vs last month"
  },
  {
    title: "Annual Premium",
    value: "$89,400",
    change: "+8%",
    trend: "up",
    icon: DollarSign,
    description: "total volume"
  },
  {
    title: "Close Rate",
    value: "68%",
    change: "+5%",
    trend: "up",
    icon: TrendingUp,
    description: "this quarter"
  },
  {
    title: "Active Leads",
    value: "42",
    change: "-3",
    trend: "down",
    icon: Users,
    description: "in pipeline"
  }
];

export const StatsCards = () => {
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
    hidden: { 
      opacity: 0, 
      y: 30,
      rotateX: -15
    },
    visible: { 
      opacity: 1, 
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 perspective-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          variants={cardVariants}
          whileHover={{ 
            y: -8,
            rotateX: 5,
            rotateY: 5,
            scale: 1.02,
            transition: { type: "spring", stiffness: 300, damping: 20 }
          }}
          whileTap={{ 
            scale: 0.98,
            y: -4
          }}
          className="transform-3d"
        >
          <Card className="stat-card overflow-hidden relative group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <motion.div
                animate={{ 
                  rotateY: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut"
                }}
              >
                <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-primary drop-shadow-sm" />
              </motion.div>
            </CardHeader>
            
            <CardContent className="relative z-10">
              <motion.div 
                className="text-xl md:text-2xl font-bold text-foreground mb-2"
                animate={{ 
                  scale: [1, 1.02, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {stat.value}
              </motion.div>
              
              <div className="flex items-center space-x-2 text-xs">
                <motion.span 
                  className={`font-medium ${
                    stat.trend === 'up' ? 'text-success' : 'text-destructive'
                  }`}
                  animate={{
                    x: stat.trend === 'up' ? [0, 2, 0] : [0, -2, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {stat.change}
                </motion.span>
                <span className="text-muted-foreground">{stat.description}</span>
              </div>
            </CardContent>
            
            {/* Floating orb effect */}
            <motion.div
              className="absolute top-2 right-2 w-2 h-2 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.8, 0.2]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};