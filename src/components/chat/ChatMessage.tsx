
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    id?: string;
    citations?: string[];
}

interface ChatMessageProps {
    message: Message;
    onCitationClick?: (citation: string) => void;
}

export function ChatMessage({ message, onCitationClick }: ChatMessageProps) {
    const isUser = message.role === 'user';

    // Parse inline citations if any (legacy check)
    const processedContent = message.content.replace(
        /\[Source: (.*?)\]/g,
        (match, content) => `**[📘 ${content}](#citation)**`
    );

    return (
        <div className={cn(
            "flex w-full gap-4 p-4 md:px-8",
            isUser ? "bg-background" : "bg-muted/30"
        )}>
            <div className={cn(
                "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border",
                isUser ? "bg-background border-border" : "bg-primary/20 border-primary/20"
            )}>
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
            </div>

            <div className="flex-1 space-y-4 overflow-hidden">
                <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            a: ({ node, ...props }) => {
                                if (props.href === "#citation") {
                                    const citationText = props.children?.toString() || "";
                                    return (
                                        <span
                                            className="inline-flex items-center rounded-md bg-blue-500/10 px-1.5 py-0.5 text-xs font-medium text-blue-500 ring-1 ring-inset ring-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors mx-1"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onCitationClick?.(citationText.replace("📘 ", ""));
                                            }}
                                        >
                                            {props.children}
                                        </span>
                                    )
                                }
                                return <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />
                            }
                        }}
                    >
                        {processedContent}
                    </ReactMarkdown>
                </div>

                {/* Explicit Citations Block */}
                {message.citations && message.citations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Sources:</p>
                        <div className="flex flex-wrap gap-2">
                            {message.citations.map((source, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary cursor-pointer hover:bg-primary/20 transition-colors"
                                    onClick={() => onCitationClick?.(source)}
                                >
                                    📄 {source}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
