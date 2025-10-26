import { motion } from 'framer-motion';
import { Copy, RefreshCw, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTypingEffect } from '@/hooks/useTypingEffect';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

interface ChatBubbleProps {
  message: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isLoading?: boolean;
  onRegenerate?: () => void;
  regenerated?: boolean;
  skipTyping?: boolean;
}

export const ChatBubble = ({ 
  message, 
  sender, 
  timestamp, 
  isLoading = false,
  onRegenerate,
  regenerated = false,
  skipTyping = false
}: ChatBubbleProps) => {
  const { toast } = useToast();
  const { displayedText, isTyping } = useTypingEffect(
    sender === 'ai' && !skipTyping ? message : '',
    30
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast({
      title: "Copied!",
      description: "Answer copied to clipboard",
    });
  };

  const finalText = sender === 'ai' && !skipTyping ? displayedText : message;
  const isUserMessage = sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUserMessage ? 'flex-row-reverse' : 'flex-row'} mb-4`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isUserMessage ? 'bg-[hsl(var(--rag-gold))]' : 'bg-white border-2 border-[hsl(var(--rag-gold))]'
      }`}>
        {isUserMessage ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-[hsl(var(--rag-gold))]" />
        )}
      </div>

      {/* Message Bubble */}
      <div className={`flex flex-col max-w-[80%] ${isUserMessage ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUserMessage
              ? 'bg-[hsl(var(--rag-gold))] text-white'
              : 'bg-white border-2 border-[hsl(var(--rag-gold))] text-[hsl(var(--rag-navy))]'
          }`}
        >
          {isUserMessage ? (
            <p className="text-sm">{message}</p>
          ) : (
            <div className="text-sm prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1">
              <ReactMarkdown>{finalText}</ReactMarkdown>
              {isTyping && <span className="inline-block w-1 h-4 bg-[hsl(var(--rag-gold))] ml-1 animate-pulse" />}
            </div>
          )}
        </div>

        {/* Timestamp and Actions */}
        <div className={`flex items-center gap-2 mt-1 ${isUserMessage ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-muted-foreground">
            {format(timestamp, 'h:mm a')}
          </span>
          
          {regenerated && !isUserMessage && (
            <span className="text-xs text-[hsl(var(--rag-gold))] font-medium">
              Regenerated
            </span>
          )}

          {!isUserMessage && !isLoading && !isTyping && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-[hsl(var(--rag-gold))]/10"
                onClick={handleCopy}
                title="Copy answer"
              >
                <Copy className="w-3 h-3" />
              </Button>
              
              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-[hsl(var(--rag-gold))]/10"
                  onClick={onRegenerate}
                  title="Regenerate answer"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
