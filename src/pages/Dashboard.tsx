import { useState, useEffect } from "react";
import { TrendingUp, Target, Calendar, Users, Award, DollarSign, Building2, FileText, Clock, Newspaper, Megaphone, Calculator } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { supabase } from "@/integrations/supabase/client";
import { ScheduleCalendarDialog } from "@/components/dashboard/ScheduleCalendarDialog";
import { formatDistanceToNow, parseISO, isAfter, isBefore, format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

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
    setGreeting(getGreeting());

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
      
      const { data, error } = await supabase
        .from('schedule_items')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(20);

      if (error) throw error;
      
      const allEvents = data || [];
      const todayEvents = allEvents.filter(item => item.date === today);
      setTodaySchedule(todayEvents);
      
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

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <Card className="featured-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
                {greeting.text}, <span className="text-gold">{userName}</span>! {greeting.emoji}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Ready to close some deals today?
              </CardDescription>
            </div>
            {hasActiveGoals && (
              <Badge variant="teal" className="text-sm">
                <Target className="w-4 h-4 mr-1" />
                Goal: {goalProgress}% this month
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
        {/* Main Content */}
        <div className="xl:col-span-8 space-y-6">
          <QuickActions />

          {/* Schedule Card */}
          <Card className="brand-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Calendar className="h-5 w-5 text-gold" />
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
                  {upcomingEvent && (
                    <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-gold/5 border border-primary/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="premium" className="bg-gold text-gold-foreground">
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
                        <Clock className="h-4 w-4 text-gold" />
                        <Badge variant="outline" className="font-mono text-xs border-gold/30">
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

                  {!upcomingEvent && todaySchedule.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No events scheduled
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: Newspaper, text: "Latest News", href: "/news" },
                { icon: Megaphone, text: "Marketing Tools", href: "/marketing" },
                { icon: Calculator, text: "Calculators", href: "/tools" }
              ].map((item) => (
                <Link key={item.text} to={item.href}>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sm md:text-base hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all" 
                    size="sm"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.text}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
