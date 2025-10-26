import { useState } from "react";
import { Bot, Send, Copy, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface QueryResult {
  id: string;
  query: string;
  answer: string;
  citations: Array<{
    title: string;
    carrier: string;
    section: string;
  }>;
  timestamp: Date;
}

const AIAssist = () => {
  const [query, setQuery] = useState("");
  const [carrier, setCarrier] = useState("all");
  const [product, setProduct] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    
    // Simulate AI response - in real app this would call your edge function
    setTimeout(() => {
      const mockResult: QueryResult = {
        id: Date.now().toString(),
        query,
        answer: `Based on the underwriting guidelines and product information, here's what I found regarding "${query}":\n\n• Term life insurance applications typically require medical exams for coverage over $250,000\n• Simplified issue products are available for amounts up to $100,000 without medical exam\n• Age limits vary by carrier but generally range from 18-75 years old\n\nFor specific requirements, I recommend checking the carrier's current underwriting manual or contacting their underwriting department directly.`,
        citations: [
          { title: "Underwriting Guidelines", carrier: "American General", section: "Section 3.2" },
          { title: "Product Manual", carrier: "Mutual of Omaha", section: "Chapter 5" }
        ],
        timestamp: new Date()
      };
      
      setResults(prev => [mockResult, ...prev]);
      setQuery("");
      setIsLoading(false);
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Answer copied successfully",
    });
  };

  const handleFeedback = (queryId: string, rating: "helpful" | "not_helpful") => {
    toast({
      title: "Feedback recorded",
      description: "Thank you for your feedback!",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground">Get instant answers from your knowledge base</p>
        </div>
      </div>

      {/* Query Form */}
      <Card className="stat-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Ask a Question
          </CardTitle>
          <CardDescription>
            Ask about underwriting guidelines, product features, or compliance requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger>
                  <SelectValue placeholder="Carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Carriers</SelectItem>
                  <SelectItem value="ag">American General</SelectItem>
                  <SelectItem value="moo">Mutual of Omaha</SelectItem>
                  <SelectItem value="ff">Foresters Financial</SelectItem>
                </SelectContent>
              </Select>

              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="term">Term Life</SelectItem>
                  <SelectItem value="wl">Whole Life</SelectItem>
                  <SelectItem value="fe">Final Expense</SelectItem>
                  <SelectItem value="annuity">Annuity</SelectItem>
                </SelectContent>
              </Select>

              <Button type="submit" disabled={isLoading || !query.trim()}>
                {isLoading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Ask
                  </>
                )}
              </Button>
            </div>

            <Input
              placeholder="e.g., What are the medical exam requirements for term life insurance?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="text-base"
            />
          </form>

          {/* Quick Questions */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Quick questions:</span>
            <div className="flex flex-wrap gap-2">
              {[
                "DUI lookback periods",
                "Diabetes underwriting",
                "Final expense health questions",
                "Term conversion options"
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(suggestion)}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-6">
        {results.map((result, index) => (
          <Card key={result.id} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader>
              <CardTitle className="text-lg">{result.query}</CardTitle>
              <CardDescription>
                {result.timestamp.toLocaleTimeString()} • {result.citations.length} sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-line text-foreground leading-relaxed">
                  {result.answer}
                </div>
              </div>

              {/* Citations */}
              {result.citations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Sources:</span>
                  <div className="flex flex-wrap gap-2">
                    {result.citations.map((citation, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {citation.carrier} - {citation.title} ({citation.section})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(result.answer)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Was this helpful?</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback(result.id, "helpful")}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback(result.id, "not_helpful")}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {results.length === 0 && !isLoading && (
        <Card className="stat-card">
          <CardContent className="py-12 text-center">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to help!</h3>
            <p className="text-muted-foreground">Ask me anything about underwriting, products, or compliance</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAssist;