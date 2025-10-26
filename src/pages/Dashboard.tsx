import { useState, useEffect } from "react";
import { TrendingUp, Target, Calendar, Users, Award, DollarSign, Building2, FileText, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { motion, useScroll, useTransform } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  description: string | null;
  date: string;
}

const Dashboard = () => {
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodaySchedule();

    // Set up realtime subscription
    const channel = supabase
      .channel('schedule_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedule_items'
        },
        () => {
          fetchTodaySchedule();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTodaySchedule = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('schedule_items')
        .select('*')
        .eq('date', today)
        .order('time', { ascending: true });

      if (error) throw error;
      setTodaySchedule(data || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };
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
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Loading schedule...</p>
                ) : todaySchedule.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No schedule items for today</p>
                ) : (
                  todaySchedule.map((item) => (
                    <motion.div 
                      key={item.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-accent/30 rounded-lg backdrop-blur-sm border border-white/10"
                      whileHover={{ 
                        backgroundColor: "rgba(var(--accent), 0.5)",
                        scale: 1.02 
                      }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="mb-2 md:mb-0 flex-1">
                        <p className="font-medium text-sm md:text-base">{item.title}</p>
                        {item.description && (
                          <p className="text-xs md:text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs md:text-sm">{item.time}</Badge>
                      </motion.div>
                    </motion.div>
                  ))
                )}
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