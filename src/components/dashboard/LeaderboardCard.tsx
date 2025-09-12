import { Award, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const leaderboard = [
  {
    name: "Sarah Chen",
    avatar: "/avatars/sarah.png",
    policies: 28,
    premium: "$94,200",
    rank: 1
  },
  {
    name: "Mike Johnson",
    avatar: "/avatars/mike.png",
    policies: 26,
    premium: "$91,800",
    rank: 2
  },
  {
    name: "Emma Davis",
    avatar: "/avatars/emma.png",
    policies: 24,
    premium: "$89,400",
    rank: 3
  },
  {
    name: "You",
    avatar: "/avatars/you.png",
    policies: 24,
    premium: "$89,400",
    rank: 4
  }
];

export const LeaderboardCard = () => {
  return (
    <Card className="stat-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Top Performers
        </CardTitle>
        <CardDescription>
          This month's leaders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {leaderboard.map((person, index) => (
          <div
            key={person.name}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-smooth ${
              person.name === "You" ? "bg-primary/10 border border-primary/20" : "hover:bg-accent/50"
            }`}
          >
            <div className="flex items-center space-x-3 flex-1">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={person.avatar} alt={person.name} />
                  <AvatarFallback>{person.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                {person.rank <= 3 && (
                  <Badge 
                    className={`absolute -top-1 -right-1 h-5 w-5 p-0 text-xs ${
                      person.rank === 1 ? 'bg-yellow-500' : 
                      person.rank === 2 ? 'bg-gray-400' : 'bg-amber-600'
                    }`}
                  >
                    {person.rank}
                  </Badge>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{person.name}</p>
                <p className="text-xs text-muted-foreground">{person.policies} policies</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{person.premium}</p>
              <div className="flex items-center text-xs text-success">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12%
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};