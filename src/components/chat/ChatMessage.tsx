
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    id?: string;
}

interface ChatMessageProps {
    message: Message;
    onCitationClick?: (citation: string) => void;
}

export function ChatMessage({ message, onCitationClick }: ChatMessageProps) {
    const isUser = message.role === 'user';

    // Function to process content and make citations interactive
    // Citations format: [Source: Carrier Name, Doc Type, p. X]
    // We will essentially rely on ReactMarkdown to parse standard text, 
    // but we might want a custom logic/plugin if we want buttons for citations.
    // For now, simpler approach: let's highlight them via CSS regex replacer if usage was raw HTML, 
    // but with ReactMarkdown it's better to treat them as custom regex/components or just bold them.
    // A simple hack: We can preprocess the string to make citation look like a link or code.
    // " [Source: ...]" -> "[📘 Source: ...](#citation)"

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

            <div className="flex-1 space-y-2 overflow-hidden">
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
            </div>
        </div>
    );
}
