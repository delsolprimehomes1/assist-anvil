import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  TrendingUp, 
  Phone, 
  Mail, 
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Filter,
  Download
} from "lucide-react";

const OrdersLeads = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Sample data
  const stats = [
    {
      title: "Total Leads",
      value: "284",
      change: "+12.5%",
      trend: "up",
      icon: TrendingUp,
      color: "from-primary/20 to-primary/5"
    },
    {
      title: "New Leads",
      value: "5",
      change: "Today",
      trend: "up",
      icon: Clock,
      color: "from-secondary/20 to-secondary/5"
    },
    {
      title: "Qualified",
      value: "47",
      change: "+8.2%",
      trend: "up",
      icon: CheckCircle2,
      color: "from-success/20 to-success/5"
    },
    {
      title: "Conversion Rate",
      value: "28%",
      change: "+3.1%",
      trend: "up",
      icon: TrendingUp,
      color: "from-primary/20 to-primary/5"
    }
  ];

  const leads = [
    {
      id: 1,
      name: "John Anderson",
      email: "john.anderson@email.com",
      phone: "(555) 123-4567",
      status: "new",
      date: "2024-01-15",
      value: "$45,000",
      product: "Term Life",
      priority: "high"
    },
    {
      id: 2,
      name: "Sarah Mitchell",
      email: "sarah.m@email.com",
      phone: "(555) 234-5678",
      status: "contacted",
      date: "2024-01-14",
      value: "$62,000",
      product: "Whole Life",
      priority: "medium"
    },
    {
      id: 3,
      name: "Michael Chen",
      email: "m.chen@email.com",
      phone: "(555) 345-6789",
      status: "qualified",
      date: "2024-01-13",
      value: "$38,000",
      product: "Universal Life",
      priority: "high"
    },
    {
      id: 4,
      name: "Emily Rodriguez",
      email: "emily.r@email.com",
      phone: "(555) 456-7890",
      status: "new",
      date: "2024-01-15",
      value: "$52,000",
      product: "Term Life",
      priority: "low"
    },
    {
      id: 5,
      name: "David Thompson",
      email: "d.thompson@email.com",
      phone: "(555) 567-8901",
      status: "contacted",
      date: "2024-01-12",
      value: "$71,000",
      product: "IUL",
      priority: "high"
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline", label: string }> = {
      new: { variant: "default", label: "New" },
      contacted: { variant: "secondary", label: "Contacted" },
      qualified: { variant: "outline", label: "Qualified" }
    };
    const config = variants[status] || variants.new;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: "text-destructive",
      medium: "text-warning",
      low: "text-muted-foreground"
    };
    return colors[priority] || colors.low;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Orders & Leads
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your insurance leads and orders
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="carrier-card hover:shadow-lg"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card className="carrier-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search leads by name, email, or phone..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="carrier-card">
        <CardHeader>
          <CardTitle>Lead Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="new">
                New
                <Badge variant="secondary" className="ml-2">5</Badge>
              </TabsTrigger>
              <TabsTrigger value="contacted">Contacted</TabsTrigger>
              <TabsTrigger value="qualified">Qualified</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-4">
                {leads.map((lead) => (
                  <div 
                    key={lead.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border/40 hover:border-primary/30 hover:bg-accent/50 transition-all duration-200"
                  >
                    <div className="flex-1 space-y-2 md:space-y-0">
                      <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{lead.name}</h3>
                            {getStatusBadge(lead.status)}
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(lead.priority)}`} />
                          </div>
                          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {lead.date}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-1">
                          <span className="text-sm font-medium text-muted-foreground">{lead.product}</span>
                          <span className="text-lg font-bold text-primary">{lead.value}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0 md:ml-4">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Phone className="h-3 w-3" />
                        Call
                      </Button>
                      <Button size="sm" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Qualify
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersLeads;
