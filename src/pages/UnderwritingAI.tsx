import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileSearch,
  Send,
  Upload,
  Bot,
  User,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ── Types ────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ── Quick Prompts ────────────────────────────────────────────

const QUICK_PROMPTS = [
  "Male, 55, Type 2 Diabetes on Metformin — what can he qualify for?",
  "Female, 42, BMI 38 — best carrier options?",
  "Who accepts tobacco use with best ratings?",
  "Compare term options for 60yo with controlled hypertension",
];

// ── Streaming helper ─────────────────────────────────────────

async function streamUnderwritingChat({
  question,
  messages,
  onDelta,
  onDone,
}: {
  question: string;
  messages: Message[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/underwriting-chat`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      question,
      messages: messages.slice(-6),
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `Error ${resp.status}`);
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        onDone();
        return;
      }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  // Flush remaining
  if (buffer.trim()) {
    for (let raw of buffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch { /* skip */ }
    }
  }

  onDone();
}

// ── Upload Dialog ────────────────────────────────────────────

function UploadGuidelineDialog() {
  const [open, setOpen] = useState(false);
  const [carrierName, setCarrierName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleUpload = async () => {
    if (!carrierName.trim() || !file) return;
    setUploading(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append("carrier_name", carrierName.trim());
      formData.append("file", file);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/underwriting-process`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setResult({
        success: true,
        message: `Processed ${data.chunks_processed} sections from "${data.file_name}" for ${data.carrier}.`,
      });
      toast.success("Guideline processed successfully!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const resetDialog = () => {
    setCarrierName("");
    setFile(null);
    setResult(null);
    setUploading(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetDialog();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Guidelines
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Carrier Guidelines</DialogTitle>
          <DialogDescription>
            Upload a PDF underwriting guide. It will be parsed and indexed for AI queries.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="carrier-name">Carrier Name</Label>
            <Input
              id="carrier-name"
              placeholder="e.g. Mutual of Omaha"
              value={carrierName}
              onChange={(e) => setCarrierName(e.target.value)}
              disabled={uploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guideline-file">PDF File</Label>
            <Input
              id="guideline-file"
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploading}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
              </p>
            )}
          </div>

          {result && (
            <div
              className={cn(
                "flex items-start gap-2 rounded-lg p-3 text-sm",
                result.success
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              <span>{result.message}</span>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!carrierName.trim() || !file || uploading}
            className="w-full gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing (this may take 1-2 min)...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload & Process
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Chat Message ─────────────────────────────────────────────

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isClarifying = !isUser && message.content.includes("I need a bit more information");

  return (
    <div className={cn(
      "flex w-full gap-4 p-4 md:px-8",
      isClarifying
        ? "border-l-4 border-l-primary bg-primary/5"
        : isUser ? "bg-background" : "bg-muted/30"
    )}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border",
          isUser ? "bg-background border-border" : "bg-primary/20 border-primary/20"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="prose prose-sm dark:prose-invert max-w-none break-words prose-p:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-headings:mt-4 prose-headings:mb-2 prose-strong:text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function UnderwritingAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  const handleSend = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || isLoading) return;
    setInput("");

    const userMsg: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamUnderwritingChat({
        question: content,
        messages: [...messages, userMsg],
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
      });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to get response");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "**Error generating response.** Please try again." },
      ]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <FileSearch className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold">Underwriting AI</h1>
            <p className="text-xs text-muted-foreground">RAG-powered carrier guideline assistant</p>
          </div>
        </div>
        <UploadGuidelineDialog />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 opacity-60">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <FileSearch className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Underwriting AI</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Ask about carrier guidelines, impairment risks, or finding the best product fit.
              Upload carrier PDFs first to build the knowledge base.
            </p>
          </div>
        ) : (
          <div className="flex flex-col py-4 w-full max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="px-4 md:px-8 py-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  </div>
                  <div className="flex-1 space-y-3 pt-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span>Searching guidelines</span>
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 rounded-md w-3/4 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer" />
                      <div className="h-4 rounded-md w-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: "100ms" }} />
                      <div className="h-4 rounded-md w-5/6 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: "200ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="w-full max-w-3xl mx-auto p-4 border-t border-border bg-background space-y-4">
        {/* Quick Prompts */}
        {messages.length === 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {QUICK_PROMPTS.map((prompt) => (
              <Button
                key={prompt}
                variant="outline"
                size="sm"
                className="whitespace-nowrap rounded-full gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50"
                onClick={() => handleSend(prompt)}
              >
                <Sparkles className="h-3 w-3 text-gold" />
                {prompt}
              </Button>
            ))}
          </div>
        )}

        <div className="relative flex items-end gap-2 bg-muted/30 p-2 rounded-xl border border-input focus-within:ring-1 focus-within:ring-ring">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              messages.length > 0 &&
              messages[messages.length - 1]?.role === "assistant" &&
              messages[messages.length - 1]?.content.includes("I need a bit more information")
                ? "Answer the question above..."
                : "Describe the client profile or ask an underwriting question..."
            }
            className="min-h-[50px] max-h-[200px] w-full resize-none border-0 bg-transparent py-3 focus-visible:ring-0 shadow-none scrollbar-thin"
            disabled={isLoading}
          />
          <Button
            size="icon"
            className={cn(
              "mb-1 shrink-0 rounded-lg transition-all",
              input.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
            disabled={!input.trim() || isLoading}
            onClick={() => handleSend()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">
            AI responses are based on uploaded carrier guidelines. Always verify with official documentation.
          </p>
        </div>
      </div>
    </div>
  );
}
