import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ChatBubble } from '@/components/ai-assist/ChatBubble';
import { RAGLoader } from '@/components/ai-assist/RAGLoader';
import { ConversationHistory } from '@/components/ai-assist/ConversationHistory';
import { useConversationHistory, Message } from '@/hooks/useConversationHistory';
import { sendRAGQuery } from '@/services/ragApi';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  regenerated?: boolean;
}

export default function AIAssist() {
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const { width, height } = useWindowSize();
  const { toast } = useToast();
  const { user } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    conversations,
    addConversation,
    updateConversation,
    clearHistory,
    deleteConversation,
  } = useConversationHistory();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isLoading]);

  const handleSendMessage = async () => {
    if (!query.trim() || query.length < 3) {
      toast({
        title: "Message too short",
        description: "Please enter at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    if (query.length > 500) {
      toast({
        title: "Message too long",
        description: "Please keep your question under 500 characters",
        variant: "destructive",
      });
      return;
    }

    // Trigger confetti
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    const userMessageId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      message: query.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await sendRAGQuery({
        question: userMessage.message,
        agent_email: user?.email,
      });

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        message: response.answer,
        sender: 'ai',
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, aiMessage]);

      // Save to conversation history
      const conversationMessage: Message = {
        id: `conv-${Date.now()}`,
        question: userMessage.message,
        answer: response.answer,
        timestamp: new Date(),
        sources: response.sources,
      };
      addConversation(conversationMessage);
    } catch (error) {
      let errorMessage = 'Failed to get response. Please try again.';
      
      if (error instanceof Error) {
        if (error.message === 'RATE_LIMIT') {
          errorMessage = '⏰ Rate limit reached. Please wait before asking another question.';
        } else if (error.message === 'TIMEOUT') {
          errorMessage = '⏱️ Request timed out. The system is taking longer than usual. Please try again.';
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Remove user message on error
      setChatMessages(prev => prev.filter(msg => msg.id !== userMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (messageId: string) => {
    const messageIndex = chatMessages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) return;

    const userMessage = chatMessages[messageIndex - 1];
    if (!userMessage || userMessage.sender !== 'user') return;

    setRegeneratingId(messageId);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    try {
      const response = await sendRAGQuery({
        question: userMessage.message,
        agent_email: user?.email,
      });

      // Update the AI message
      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, message: response.answer, regenerated: true, timestamp: new Date() }
            : msg
        )
      );

      // Update conversation history
      const relatedConversation = conversations.find(
        conv => conv.question === userMessage.message
      );
      if (relatedConversation) {
        updateConversation(relatedConversation.id, {
          answer: response.answer,
          regenerated: true,
          timestamp: new Date(),
        });
      }

      toast({
        title: "Answer regenerated",
        description: "Got a fresh response from the system",
      });
    } catch (error) {
      toast({
        title: "Failed to regenerate",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, hsl(var(--rag-background)), hsl(var(--rag-background-light)))' }}>
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          colors={['#C98A3A', '#E5B15E', '#FFD700', '#FFFFFF']}
          gravity={0.3}
        />
      )}

      {/* Header */}
      <div className="border-b border-white/10 bg-[hsl(var(--rag-background))]/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-8 h-8 text-[hsl(var(--rag-gold))]" />
                </motion.div>
                <h1 className="text-3xl font-bold text-white">AI Assistant 💬</h1>
              </div>
              <p className="text-white/60 mt-1">
                Ask real-time questions — powered by BatterBox RAG System.
              </p>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="border-[hsl(var(--rag-gold))] text-[hsl(var(--rag-gold))]">
                    <Info className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    This assistant pulls data from the BatterBox database and responds using AI-enhanced retrieval (RAG). 
                    Answers are based on carrier guides, underwriting guidelines, and compliance information.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
          >
            {chatMessages.length === 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Sparkles className="w-16 h-16 text-[hsl(var(--rag-gold))]" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Ready to help!</h2>
                <p className="text-white/60 max-w-md">
                  Ask me anything about carriers, licensing, underwriting guidelines, or compliance requirements.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 max-w-2xl">
                  {[
                    'What are the underwriting guidelines for American Amicable?',
                    'Tell me about licensing requirements in Texas',
                    'What compliance training do I need?',
                    'Compare term life products from different carriers',
                  ].map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setQuery(suggestion)}
                      className="text-left p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[hsl(var(--rag-gold))]/50 transition-all text-sm text-white/80 hover:text-white"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {chatMessages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg.message}
                sender={msg.sender}
                timestamp={msg.timestamp}
                regenerated={msg.regenerated}
                onRegenerate={msg.sender === 'ai' ? () => handleRegenerate(msg.id) : undefined}
                skipTyping={msg.regenerated || regeneratingId === msg.id}
              />
            ))}

            {isLoading && <RAGLoader />}
          </div>

          {/* Input Bar */}
          <div className="border-t border-white/10 bg-[hsl(var(--rag-background))]/80 backdrop-blur-sm p-4">
            <div className="container mx-auto max-w-4xl">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything about carriers, licensing, or underwriting…"
                    className="min-h-[60px] max-h-[200px] resize-none bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[hsl(var(--rag-gold))] focus:ring-[hsl(var(--rag-gold))]"
                    disabled={isLoading}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-white/40">
                    {query.length}/500
                  </div>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!query.trim() || query.length < 3 || isLoading}
                  className="h-[60px] px-6 bg-[hsl(var(--rag-gold))] hover:bg-[hsl(var(--rag-gold-light))] text-white shadow-lg hover:shadow-[0_0_20px_hsl(var(--rag-gold))] transition-all"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        <div className="w-96 border-l border-white/10 bg-[hsl(var(--rag-background))]/50 backdrop-blur-sm overflow-y-auto p-6 hidden lg:block">
          <ConversationHistory
            conversations={conversations}
            onClearHistory={clearHistory}
            onDeleteConversation={deleteConversation}
          />
        </div>
      </div>
    </div>
  );
}
