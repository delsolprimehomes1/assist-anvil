
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
    className?: string;
}

const QUICK_PROMPTS = [
    "Find Term Life for 50yo smoker",
    "Carriers for Type 2 Diabetes",
    "Who accepts high BMI?",
    "Best whole life for 100k?"
];

export function ChatInput({ onSend, isLoading, className }: ChatInputProps) {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        if (input.trim() && !isLoading) {
            onSend(input.trim());
            setInput("");
            // Reset height
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Auto-resize
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }
    }, [input]);

    return (
        <div className={cn("p-4 border-t border-border bg-background space-y-4", className)}>
            {/* Quick Prompts */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {QUICK_PROMPTS.map((prompt) => (
                    <Button
                        key={prompt}
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap rounded-full gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50"
                        onClick={() => setInput(prompt)}
                    >
                        <Sparkles className="h-3 w-3 text-gold" />
                        {prompt}
                    </Button>
                ))}
            </div>

            <div className="relative flex items-end gap-2 bg-muted/30 p-2 rounded-xl border border-input focus-within:ring-1 focus-within:ring-ring">
                <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask the Underwriting Coach..."
                    className="min-h-[50px] max-h-[200px] w-full resize-none border-0 bg-transparent py-3 focus-visible:ring-0 shadow-none scrollbar-thin"
                    disabled={isLoading}
                />
                <Button
                    size="icon"
                    className={cn("mb-1 shrink-0 rounded-lg transition-all", input.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                    disabled={!input.trim() || isLoading}
                    onClick={handleSend}
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>

            <div className="text-center">
                <p className="text-[10px] text-muted-foreground">
                    AI generated responses may vary. Always verify with official carrier documentation.
                </p>
            </div>
        </div>
    );
}
