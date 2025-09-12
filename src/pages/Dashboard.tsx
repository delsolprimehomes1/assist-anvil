import { TrendingUp, Target, Calendar, Users, Award, DollarSign, Building2, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { LeaderboardCard } from "@/components/dashboard/LeaderboardCard";
import { motion, useScroll, useTransform } from "framer-motion";

const Dashboard = () => {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 200], [0, -50]);
  const heroOpacity = useTransform(scrollY, [0, 200], [1, 0.8]);

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <motion.div 
      className="space-y-6 md:space-y-8 min-h-screen"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Welcome Section */}
      <motion.div 
        className="hero-card rounded-2xl md:rounded-3xl p-6 md:p-8 relative overflow-hidden"
        variants={sectionVariants}
        style={{ y: heroY, opacity: heroOpacity }}
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Background animated elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-32 bg-white/5 rounded-full blur-xl"
              style={{
                top: `${20 + i * 30}%`,
                left: `${70 + i * 10}%`,
              }}
              animate={{
                x: [0, 20, 0],
                y: [0, -20, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5
              }}
            />
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between relative z-10">
          <motion.div 
            className="space-y-2 md:space-y-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.h1 
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-white"
              animate={{ 
                textShadow: [
                  "0 0 10px rgba(255,255,255,0.3)",
                  "0 0 20px rgba(255,255,255,0.5)",
                  "0 0 10px rgba(255,255,255,0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Good morning, John! 👋
            </motion.h1>
            <motion.p 
              className="text-white/90 text-base md:text-lg"
              animate={{ opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Ready to close some deals today?
            </motion.p>
          </motion.div>
          <motion.div 
            className="mt-4 md:mt-0 flex items-center space-x-3 md:space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Target className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                Goal: 80% this month
              </Badge>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={sectionVariants}>
        <StatsCards />
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 w-full">
        {/* Main Content Area */}
        <motion.div 
          className="xl:col-span-8 space-y-6"
          variants={sectionVariants}
        >
          {/* Quick Actions */}
          <QuickActions />

          {/* Recent Activity */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Card className="card-3d overflow-hidden">
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Calendar className="h-5 w-5 text-primary" />
                  </motion.div>
                  Today's Schedule
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Upcoming appointments and deadlines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div 
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-accent/30 rounded-lg backdrop-blur-sm border border-white/10"
                  whileHover={{ 
                    backgroundColor: "rgba(var(--accent), 0.5)",
                    scale: 1.02 
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="mb-2 md:mb-0">
                    <p className="font-medium text-sm md:text-base">Client Meeting - Sarah Johnson</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Life Insurance Quote Review</p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Badge variant="outline" className="text-xs md:text-sm">2:00 PM</Badge>
                  </motion.div>
                </motion.div>
                
                <motion.div 
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-accent/30 rounded-lg backdrop-blur-sm border border-white/10"
                  whileHover={{ 
                    backgroundColor: "rgba(var(--accent), 0.5)",
                    scale: 1.02 
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="mb-2 md:mb-0">
                    <p className="font-medium text-sm md:text-base">License Renewal Due</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Texas - Expires in 30 days</p>
                  </div>
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.8, 1, 0.8] 
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut" 
                    }}
                  >
                    <Badge variant="secondary" className="bg-warning/20 text-warning-foreground text-xs md:text-sm">
                      Expiring Soon
                    </Badge>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Sidebar Content */}
        <motion.div 
          className="xl:col-span-4 space-y-6"
          variants={sectionVariants}
        >
          {/* Leaderboard */}
          <LeaderboardCard />

          {/* Quick Links */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Card className="card-3d">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: Building2, text: "Add New Carrier" },
                  { icon: Calendar, text: "Schedule Appointment" },
                  { icon: FileText, text: "Upload Document" }
                ].map((item, index) => (
                  <motion.div
                    key={item.text}
                    whileHover={{ x: 4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-sm md:text-base hover:shadow-lg transition-all duration-200" 
                      size="sm"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.text}
                    </Button>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;