import { TrendingUp, Target, Calendar, Users, Award, DollarSign, Building2, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { LeaderboardCard } from "@/components/dashboard/LeaderboardCard";

const Dashboard = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Welcome Section */}
      <div className="hero-card rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Good morning, John! 👋</h1>
            <p className="text-white/90 text-lg">Ready to close some deals today?</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Target className="w-4 h-4 mr-1" />
              Goal: 80% this month
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <QuickActions />

          {/* Recent Activity */}
          <Card className="stat-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Today's Schedule
              </CardTitle>
              <CardDescription>
                Upcoming appointments and deadlines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                <div>
                  <p className="font-medium">Client Meeting - Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">Life Insurance Quote Review</p>
                </div>
                <Badge variant="outline">2:00 PM</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                <div>
                  <p className="font-medium">License Renewal Due</p>
                  <p className="text-sm text-muted-foreground">Texas - Expires in 30 days</p>
                </div>
                <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">
                  Expiring Soon
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <LeaderboardCard />

          {/* Quick Links */}
          <Card className="stat-card">
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Building2 className="mr-2 h-4 w-4" />
                Add New Carrier
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Appointment
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;