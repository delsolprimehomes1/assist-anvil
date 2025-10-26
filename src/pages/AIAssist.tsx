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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-2xl mx-auto py-12 md:py-16 px-6 md:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            AI Assistant
          </h1>
          <p className="text-lg text-slate-600">
            Ask questions and get intelligent answers from our knowledge base
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl shadow-slate-200/50 rounded-2xl md:rounded-3xl p-8 md:p-10 mb-12">
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">Ask Your Question</h2>
          <p className="text-slate-600 text-base mb-6">
            Type your question below and press Cmd/Ctrl + Enter to submit quickly
          </p>
          
          <div className="space-y-6">
            <div className="relative">
              <Textarea
                placeholder="What would you like to know?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[180px] resize-none border-0 bg-slate-50/50 p-4 text-base md:text-lg rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400 transition-all"
                maxLength={1000}
                disabled={isLoading}
              />
              {charCount > 0 && (
                <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                  {charCount}/1000
                </div>
              )}
            </div>
            
            {charCount < 10 && charCount > 0 && (
              <p className="text-sm text-red-500">Please enter at least 10 characters</p>
            )}
            
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full md:w-auto px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg hover:-translate-y-0.5 transition-all rounded-xl text-white"
              >
                {isLoading ? (
                  <>Getting Answer...</>
                ) : (
                  <>
                    Get Answer
                    <Send className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="space-y-8">
            {results.map((result) => (
              <div 
                key={result.id}
                className="bg-white/60 backdrop-blur shadow-lg shadow-slate-200/50 rounded-2xl p-8"
              >
                <h3 className="text-xl font-semibold text-slate-800 mb-1">
                  {result.question}
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  {result.timestamp.toLocaleString()}
                </p>
                
                <div className="prose prose-slate max-w-none mb-6">
                  <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {result.answer}
                  </p>
                </div>
                
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(result.answer)}
                    className="hover:bg-slate-100/50 rounded-lg"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback(result.id, true)}
                    className="hover:bg-slate-100/50 rounded-lg"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback(result.id, false)}
                    className="hover:bg-slate-100/50 rounded-lg"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-transparent py-12 text-center space-y-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-5 flex items-center justify-center">
                <Brain className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold text-slate-800">
                Ready to help you find answers
              </h3>
              <p className="text-slate-600 text-lg max-w-md mx-auto">
                Ask any question and I'll search through our knowledge base to provide you with accurate information.
              </p>
            </div>
            
            <div className="max-w-md mx-auto text-left border-l-4 border-blue-500 pl-6 py-4">
              <div className="flex items-start gap-3 mb-4">
                <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                <span className="font-semibold text-slate-800">Tips for better results:</span>
              </div>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Be specific with your questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Include relevant context or details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Ask one question at a time for clarity</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssist;
