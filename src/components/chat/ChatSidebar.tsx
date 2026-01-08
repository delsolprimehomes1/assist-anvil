
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquarePlus, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSession {
    id: string;
    title: string;
    created_at: string;
}

interface ChatSidebarProps {
    sessions: ChatSession[];
    currentSessionId: string | null;
    onSelectSession: (id: string) => void;
    onNewChat: () => void;
    onDeleteSession: (id: string) => void;
    className?: string;
}

export function ChatSidebar({
    sessions,
    currentSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession,
    className
}: ChatSidebarProps) {
    return (
        <div className={cn("hidden md:flex flex-col w-64 border-r border-border h-[calc(100vh-4rem)] bg-card/50", className)}>
            <div className="p-4 border-b border-border">
                <Button onClick={onNewChat} className="w-full gap-2 bg-primary hover:bg-primary/90">
                    <MessageSquarePlus className="h-4 w-4" />
                    New Chat
                </Button>
            </div>

            <ScrollArea className="flex-1 px-2 py-4">
                <div className="space-y-2">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className={cn(
                                "group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-accent/50",
                                currentSessionId === session.id ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )}
                            onClick={() => onSelectSession(session.id)}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <MessageSquare className="h-4 w-4 shrink-0" />
                                <span className="truncate text-sm font-medium">
                                    {session.title || "New Conversation"}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSession(session.id);
                                }}
                            >
                                <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                        </div>
                    ))}

                    {sessions.length === 0 && (
                        <div className="text-center text-xs text-muted-foreground py-8">
                            No recent chats
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
