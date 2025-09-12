import { useState } from "react";
import { GraduationCap, Play, BookOpen, Clock, Star, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

const training = [
  {
    id: 1,
    title: "Mastering Final Expense Sales",
    description: "Complete guide to selling final expense insurance policies",
    mediaType: "video",
    lengthMinutes: 45,
    difficulty: "beginner",
    tags: ["final_expense", "sales"],
    progress: 75,
    publishedAt: "2024-01-15"
  },
  {
    id: 2,
    title: "Handling Objections Like a Pro",
    description: "Advanced techniques for overcoming client objections",
    mediaType: "video",
    lengthMinutes: 30,
    difficulty: "advanced",
    tags: ["sales", "objections"],
    progress: 0,
    publishedAt: "2024-01-20"
  },
  {
    id: 3,
    title: "Term Life Insurance Underwriting",
    description: "Understanding the underwriting process for term policies",
    mediaType: "doc",
    lengthMinutes: 20,
    difficulty: "intermediate",
    tags: ["term_life", "underwriting"],
    progress: 100,
    publishedAt: "2024-01-10"
  },
  {
    id: 4,
    title: "Carrier Training: American General",
    description: "Product-specific training for AG products",
    mediaType: "video",
    lengthMinutes: 60,
    difficulty: "intermediate",
    tags: ["carrier_training", "american_general"],
    progress: 25,
    publishedAt: "2024-01-18"
  }
];

const Training = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const filteredTraining = training.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDifficulty = selectedDifficulty === "all" || item.difficulty === selectedDifficulty;
    const matchesType = selectedType === "all" || item.mediaType === selectedType;
    return matchesSearch && matchesDifficulty && matchesType;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case "video": return Play;
      case "audio": return Play;
      case "doc": return BookOpen;
      default: return BookOpen;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            Training Center
          </h1>
          <p className="text-muted-foreground">Enhance your skills with our comprehensive training library</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="stat-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search training..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="doc">Document</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Training Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {training.filter(t => t.progress === 100).length}
            </div>
            <p className="text-xs text-muted-foreground">Training modules</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {training.filter(t => t.progress > 0 && t.progress < 100).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently watching</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(training.reduce((acc, t) => acc + t.lengthMinutes, 0) / 60)}
            </div>
            <p className="text-xs text-muted-foreground">Available content</p>
          </CardContent>
        </Card>
      </div>

      {/* Training Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTraining.map((item, index) => {
          const MediaIcon = getMediaIcon(item.mediaType);
          return (
            <Card key={item.id} className="stat-card hover-lift" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3 w-full">
                  <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                    <MediaIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <CardTitle className="text-base sm:text-lg leading-tight line-clamp-2 mb-1">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-sm line-clamp-2">
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.lengthMinutes} minutes</span>
                  <Badge className={`text-xs ${getDifficultyColor(item.difficulty)}`}>
                    {item.difficulty}
                  </Badge>
                </div>

                {item.progress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button className="w-full" size="sm">
                  {item.progress === 0 ? "Start Training" : 
                   item.progress === 100 ? "Review" : "Continue"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTraining.length === 0 && (
        <Card className="stat-card">
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No training found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Training;