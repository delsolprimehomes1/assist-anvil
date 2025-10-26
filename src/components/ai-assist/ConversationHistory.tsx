import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Message } from '@/hooks/useConversationHistory';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

interface ConversationHistoryProps {
  conversations: Message[];
  onClearHistory: () => void;
  onDeleteConversation: (id: string) => void;
  onLoadConversation?: (conversation: Message) => void;
}

export const ConversationHistory = ({
  conversations,
  onClearHistory,
  onDeleteConversation,
  onLoadConversation,
}: ConversationHistoryProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No previous conversations yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[hsl(var(--rag-gold))]" />
          <h3 className="text-lg font-semibold">Previous Conversations</h3>
          <Badge variant="secondary">{conversations.length}</Badge>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              Clear History
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all conversations?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your conversation history. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onClearHistory} className="bg-destructive">
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {conversations.map((conversation, index) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-4 hover:border-[hsl(var(--rag-gold))] transition-colors glass">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">
                        {format(conversation.timestamp, 'MMM d, yyyy • h:mm a')}
                      </span>
                      {conversation.regenerated && (
                        <Badge variant="outline" className="text-xs">
                          Regenerated
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm font-medium text-foreground mb-1 truncate">
                      {conversation.question}
                    </p>

                    <AnimatePresence>
                      {expandedId === conversation.id ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 pt-2 border-t">
                            <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                              <ReactMarkdown>{conversation.answer}</ReactMarkdown>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {conversation.answer.substring(0, 100)}...
                        </p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-start gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        setExpandedId(expandedId === conversation.id ? null : conversation.id)
                      }
                    >
                      {expandedId === conversation.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this conversation from your history.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteConversation(conversation.id)}
                            className="bg-destructive"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
