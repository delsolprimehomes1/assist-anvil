import { useState } from "react";
import { Calculator, FileText, Search, BookOpen, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommissionCalculator } from "@/components/tools/CommissionCalculator";

const resources = [
  {
    id: 2,
    title: "Commission Calculator",
    type: "calculator", 
    description: "Calculate potential commission earnings",
    tags: ["sales", "planning"],
    carrier: "Universal",
    lastUpdated: "2024-01-10"
  },
  {
    id: 5,
    title: "FE Health Matrix",
    type: "guide",
    description: "Final expense health question matrix",
    tags: ["final_expense", "underwriting"],
    carrier: "Multiple",
    lastUpdated: "2024-01-22"
  },
  {
    id: 6,
    title: "Illustration Link",
    type: "tool",
    description: "Access WinFlexWeb to run client illustrations and proposals",
    tags: ["illustrations", "proposals", "sales"],
    carrier: "Universal",
    lastUpdated: "2024-01-25",
    url: "https://www.winflexweb.com/"
  }
];

const Tools = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("resources");

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "calculator": return Calculator;
      case "guide": return BookOpen;
      case "cheat_sheet": return FileText;
      case "tool": return ExternalLink;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "calculator": return "bg-blue-100 text-blue-800";
      case "guide": return "bg-green-100 text-green-800";
      case "cheat_sheet": return "bg-purple-100 text-purple-800";
      case "tool": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tools & Resources</h1>
          <p className="text-muted-foreground">Calculators, guides, and reference materials to help you close more deals</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="calculators">Calculators</TabsTrigger>
          <TabsTrigger value="guides">Quick Guides</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-6">
          {/* Search */}
          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tools and resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource, index) => {
              const Icon = getTypeIcon(resource.type);
              return (
                <Card key={resource.id} className="stat-card hover-lift" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{resource.title}</CardTitle>
                          <CardDescription className="text-sm">{resource.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className={`text-xs ${getTypeColor(resource.type)}`}>
                        {resource.type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {resource.carrier}
                      </span>
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-1">
                        {resource.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                      <span>Updated: {resource.lastUpdated}</span>
                    </div>

                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => {
                        if (resource.url) {
                          window.open(resource.url, '_blank');
                        }
                      }}
                    >
                      Open Tool
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="calculators" className="space-y-6">
          <CommissionCalculator />
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="stat-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  FE Health Questions
                </CardTitle>
                <CardDescription>Common final expense health questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <p>• Hospitalized in past 2 years?</p>
                  <p>• Currently taking insulin?</p>
                  <p>• Diagnosed with cancer?</p>
                  <p>• Heart attack or stroke?</p>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  View Full Matrix
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tools;