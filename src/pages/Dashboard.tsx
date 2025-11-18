import { useState, useEffect } from "react";
import { TrendingUp, Target, Calendar, Users, Award, DollarSign, Building2, FileText, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { motion, useScroll, useTransform } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ScheduleCalendarDialog } from "@/components/dashboard/ScheduleCalendarDialog";
import { formatDistanceToNow, parseISO, isAfter, isBefore, startOfDay, format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  description: string | null;
  date: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [upcomingEvent, setUpcomingEvent] = useState<ScheduleItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("there");
  const [greeting, setGreeting] = useState<{ text: string; emoji: string }>({ text: "Hello", emoji: "👋" });
  const [goalProgress, setGoalProgress] = useState<number | null>(null);
  const [hasActiveGoals, setHasActiveGoals] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return { text: "Good morning", emoji: "🌅" };
    } else if (hour >= 12 && hour < 17) {
      return { text: "Good afternoon", emoji: "☀️" };
    } else if (hour >= 17 && hour < 21) {
      return { text: "Good evening", emoji: "🌆" };
    } else {
      return { text: "Good night", emoji: "🌙" };
    }
  };

  useEffect(() => {
    // Set greeting based on current time
    setGreeting(getGreeting());

    // Fetch user name
    const fetchUserName = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
        
        if (data?.full_name) {
          setUserName(data.full_name);
        }
      }
    };

    fetchUserName();
    fetchGoalProgress();
    fetchSchedule();

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
          fetchSchedule();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchGoalProgress = async () => {
    if (!user?.id) return;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    try {
      const { data: goals, error } = await supabase
        .from('business_goals')
        .select('progress_percentage, status')
        .eq('agent_id', user.id)
        .in('status', ['in_progress', 'not_started'])
        .or(`target_date.gte.${startOfMonth.toISOString()},target_date.lte.${endOfMonth.toISOString()},target_date.is.null`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (goals && goals.length > 0) {
        const avgProgress = Math.round(
          goals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / goals.length
        );
        setGoalProgress(avgProgress);
        setHasActiveGoals(true);
      } else {
        setHasActiveGoals(false);
        setGoalProgress(null);
      }
    } catch (error) {
      console.error('Error fetching goal progress:', error);
      setHasActiveGoals(false);
      setGoalProgress(null);
    }
  };

  const fetchSchedule = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date();
      
      // Fetch today's and future schedule items
      const { data, error } = await supabase
        .from('schedule_items')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(20);

      if (error) throw error;
      
      const allEvents = data || [];
      
      // Filter today's events
      const todayEvents = allEvents.filter(item => item.date === today);
      setTodaySchedule(todayEvents);
      
      // Find next upcoming event
      const upcoming = allEvents.find(item => {
        const eventDateTime = parseISO(`${item.date}T${item.time}`);
        return isAfter(eventDateTime, now);
      });
      
      setUpcomingEvent(upcoming || null);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (date: string, time: string) => {
    try {
      const eventDateTime = parseISO(`${date}T${time}`);
      return formatDistanceToNow(eventDateTime, { addSuffix: true });
    } catch {
      return '';
    }
  };

  const isEventPast = (date: string, time: string) => {
    try {
      const eventDateTime = parseISO(`${date}T${time}`);
      return isBefore(eventDateTime, new Date());
    } catch {
      return false;
    }
  };

  const formatTime12Hour = (time: string): string => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
      return time;
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
              {greeting.text}, {userName}! {greeting.emoji}
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
                {hasActiveGoals ? (
                  <>Goal: {goalProgress}% this month</>
                ) : (
                  <>Set your goals</>
                )}
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

          {/* Unified Schedule Card */}
          <Card className="card-3d overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                      <Calendar className="h-5 w-5 text-primary" />
                      Schedule
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Your upcoming events
                    </CardDescription>
                  </div>
                  <ScheduleCalendarDialog />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Loading schedule...</p>
                ) : (
                  <>
                    {/* Next Up Section */}
                    {upcomingEvent && (
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="default" className="bg-primary text-primary-foreground">
                            NEXT UP
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {getRelativeTime(upcomingEvent.date, upcomingEvent.time)}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold">{upcomingEvent.title}</h3>
                          {upcomingEvent.description && (
                            <p className="text-sm text-muted-foreground">{upcomingEvent.description}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <Badge variant="outline" className="font-mono text-xs">
                            {formatTime12Hour(upcomingEvent.time)}
                          </Badge>
                          {upcomingEvent.date !== format(new Date(), 'yyyy-MM-dd') && (
                            <span className="text-sm text-muted-foreground">
                              {new Date(upcomingEvent.date + 'T00:00:00').toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Today's Events */}
                    {todaySchedule.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Today's Events</h4>
                        {todaySchedule.map((item) => {
                          const isPast = isEventPast(item.date, item.time);
                          return (
                            <div 
                              key={item.id}
                              className={`flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border transition-all ${
                                isPast 
                                  ? 'bg-muted/30 border-border/50 opacity-60' 
                                  : 'bg-muted/50 border-border hover:bg-muted/70'
                              }`}
                            >
                              <div className="mb-2 md:mb-0 flex-1">
                                <p className={`font-medium text-sm ${isPast ? 'line-through' : ''}`}>
                                  {item.title}
                                </p>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground">{item.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                <Badge variant="outline" className="text-xs">
                                  {formatTime12Hour(item.time)}
                                </Badge>
                                <span className="text-xs text-muted-foreground hidden md:inline">
                                  {getRelativeTime(item.date, item.time)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Empty State */}
                    {!upcomingEvent && todaySchedule.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No events scheduled
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
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