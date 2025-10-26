import { useState } from "react";
import { Brain, Send, Copy, ThumbsUp, ThumbsDown, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendRAGQuery } from "@/services/ragApi";

interface QueryResult {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
}

const AIAssist = () => {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const { toast } = useToast();

  const charCount = question.length;
  const isValid = charCount >= 10 && charCount <= 1000;
  const canSubmit = isValid && !isLoading;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    const currentQuestion = question.trim();

    try {
      const response = await sendRAGQuery(currentQuestion);
      
      const newResult: QueryResult = {
        id: Date.now().toString(),
        question: currentQuestion,
        answer: response.answer,
        timestamp: new Date(),
      };

      setResults((prev) => [newResult, ...prev]);
      setQuestion("");
      
      toast({
        title: "Answer received",
        description: "Your question has been answered successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Answer copied to clipboard",
    });
  };

  const handleFeedback = (resultId: string, isPositive: boolean) => {
    toast({
      title: "Feedback recorded",
      description: `Thank you for your ${isPositive ? "positive" : ""} feedback!`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">AI Assistant</h1>
          </div>
          <p className="text-muted-foreground">
            Ask questions and get intelligent answers from our knowledge base
          </p>
        </div>

        {/* Input Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ask Your Question</CardTitle>
            <CardDescription>
              Type your question below and press Cmd/Ctrl + Enter to submit quickly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="What would you like to know?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[120px] resize-none"
                maxLength={1000}
                disabled={isLoading}
              />
              <div className="flex items-center justify-between">
                <span className={`text-sm ${charCount < 10 ? "text-destructive" : "text-muted-foreground"}`}>
                  {charCount < 10 && charCount > 0 && "Please enter at least 10 characters"}
                  {charCount === 0 && " "}
                </span>
                <span className="text-sm text-muted-foreground">
                  {charCount}/1000 characters
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>Getting Answer...</>
                ) : (
                  <>
                    Get Answer
                    <Send className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{result.question}</CardTitle>
                  <CardDescription>
                    {result.timestamp.toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground whitespace-pre-wrap">{result.answer}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.answer)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFeedback(result.id, true)}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFeedback(result.id, false)}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Ready to help you find answers</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Ask any question and I'll search through our knowledge base to provide you with accurate information.
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto text-left">
                  <div className="flex items-start gap-3 mb-3">
                    <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
                    <span className="font-medium">Tips for better results:</span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-8">
                    <li>• Be specific with your questions</li>
                    <li>• Include relevant context or details</li>
                    <li>• Ask one question at a time for clarity</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AIAssist;
