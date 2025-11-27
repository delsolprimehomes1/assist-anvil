import { useState } from "react";
import { Brain, Send, Copy, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendRAGQuery } from "@/services/ragApi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface QueryResult {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "What carriers do you work with?",
  "Tell me about term life insurance",
  "How does underwriting work?",
];

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3">
    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
  </div>
);

const AIAssist = () => {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const { toast } = useToast();

  const charCount = question.length;
  const isValid = charCount >= 10 && charCount <= 1000;
  const canSubmit = isValid && !isLoading;

  const handleSubmit = async (customQuestion?: string) => {
    const questionToSubmit = customQuestion || question.trim();
    if (!questionToSubmit || (!customQuestion && !canSubmit)) return;

    setIsLoading(true);
    if (!customQuestion) setQuestion("");

    try {
      const sessionId = user?.id || crypto.randomUUID();
      const response = await sendRAGQuery(questionToSubmit, sessionId);
      
      const newResult: QueryResult = {
        id: Date.now().toString(),
        question: questionToSubmit,
        answer: response.output,
        timestamp: new Date(),
      };

      setResults((prev) => [newResult, ...prev]);
      
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header Section */}
      <div className="border-b border-border/40 bg-gradient-to-r from-primary/5 via-background to-primary/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-4 shadow-lg shadow-primary/20">
              <Brain className="w-8 h-8 text-primary-foreground animate-pulse" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3">
              AI Assistant
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Your intelligent insurance knowledge companion
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Input Section - Chat Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Ask me anything about insurance, carriers, underwriting..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[120px] resize-none text-base bg-background border-border focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                  maxLength={1000}
                  disabled={isLoading}
                />
                {charCount > 0 && (
                  <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                    {charCount}/1000
                  </div>
                )}
              </div>
              
              {charCount < 10 && charCount > 0 && (
                <p className="text-sm text-destructive">Minimum 10 characters required</p>
              )}
              
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Press <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘ + Enter</kbd> to send
                </p>
                <Button
                  onClick={() => handleSubmit()}
                  disabled={!canSubmit}
                  className="ml-auto px-6 py-5 bg-gradient-to-r from-accent-gold to-accent-gold/80 hover:from-accent-gold/90 hover:to-accent-gold/70 text-foreground shadow-lg shadow-accent-gold/30 hover:shadow-xl hover:shadow-accent-gold/40 hover:scale-105 transition-all duration-200 rounded-xl font-semibold"
                >
                  {isLoading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      Ask Question
                      <Send className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        <AnimatePresence>
          {isLoading && results.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8"
            >
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-border">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="px-6 py-6 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="px-6 pb-4">
                  <TypingIndicator />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence mode="popLayout">
          {results.length > 0 ? (
            <div className="space-y-6">
              {results.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-card border border-primary/20 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {/* Question Header */}
                  <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background px-6 py-4 border-b border-border">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground mb-1 break-words">
                          {result.question}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {result.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Answer Content */}
                  <div className="px-6 py-6">
                    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-p:text-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-strong:font-semibold prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-li:marker:text-primary prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-table:border-collapse prose-th:bg-muted prose-th:text-foreground prose-th:font-semibold prose-th:border prose-th:border-border prose-td:border prose-td:border-border">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {result.answer}
                      </ReactMarkdown>
                    </div>
                  </div>
                  
                  {/* Actions Footer */}
                  <div className="bg-muted/30 px-6 py-3 border-t border-border flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.answer)}
                      className="hover:bg-background/80 rounded-lg transition-all"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFeedback(result.id, true)}
                      className="hover:bg-background/80 hover:text-primary rounded-lg transition-all"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFeedback(result.id, false)}
                      className="hover:bg-background/80 hover:text-destructive rounded-lg transition-all"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : !isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center py-12 space-y-8"
            >
              {/* Empty State Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <Brain className="w-10 h-10 text-primary-foreground" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-foreground">
                  Ready to assist you
                </h3>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  Ask any question and get instant answers from our knowledge base
                </p>
              </div>
              
              {/* Suggested Questions */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">Try asking:</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                      onClick={() => handleSubmit(q)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-card hover:bg-primary/5 border border-border hover:border-primary/50 rounded-xl text-sm text-foreground transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {q}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIAssist;
