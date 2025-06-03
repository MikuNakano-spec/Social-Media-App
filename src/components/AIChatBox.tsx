import { cn } from "@/lib/utils";
import { useChat } from "ai/react";
import { Bot, SendHorizontal, Trash, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { type Message } from "ai";
import { Button } from "./ui/button";

interface AIChatBoxProps {
  open: boolean;
  onClose: () => void;
}

interface ChatMessageProps {
  message: Message;
}

export default function AIChatBox({ open, onClose }: AIChatBoxProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    isLoading,
    error,
  } = useChat({
    api: '/api/chat',
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const lastMessageIsUser = messages[messages.length - 1]?.role === "user";

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 w-full max-w-[450px] transition-all duration-300 ease-in-out",
        open ? "translate-y-0 opacity-100" : "translate-y-[calc(100%+24px)] opacity-0"
      )}
    >
      <div className="relative h-[500px] rounded-xl border bg-gradient-to-b from-background to-muted/20 shadow-2xl backdrop-blur-lg">
        <div className="absolute -top-12 right-0">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 bg-background p-0 shadow-lg hover:bg-accent"
          >
            <XCircle size={28} className="text-foreground" />
          </Button>
        </div>
        
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <div className="flex items-center gap-2">
              <Bot size={24} className="text-primary" />
              <h2 className="text-lg font-semibold">Nakano AI Assistant</h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
            {messages.map((message) => (
              <ChatMessage message={message} key={message.id} />
            ))}
            {isLoading && lastMessageIsUser && (
              <ChatMessage
                message={{
                  id: "loading",
                  role: "assistant",
                  content: "Đang suy nghĩ...",
                }}
              />
            )}
            {error && (
              <ChatMessage
                message={{
                  id: "error",
                  role: "assistant",
                  content: "Đã có lỗi xảy ra. Vui lòng thử lại!",
                }}
              />
            )}
            {!error && messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Bot size={40} className="text-primary" />
                </div>
                <p className="text-xl font-medium">Xin chào! Mình là Nakano</p>
                <p className="text-muted-foreground">
                  Hỏi mình bất cứ điều gì bạn thắc mắc nhé!
                </p>
              </div>
            )}
          </div>

          <form 
            onSubmit={handleSubmit} 
            className="border-t p-4"
          >
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setMessages([])}
              >
                <Trash size={18} />
              </Button>
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Nhập tin nhắn..."
                className="flex-1 rounded-lg border bg-background px-4 py-3 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                ref={inputRef}
              />
              <Button
                type="submit"
                size="icon"
                className="shrink-0 bg-primary text-background hover:bg-primary/90"
                disabled={isLoading || input.length === 0}
              >
                <SendHorizontal size={18} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message: { role, content } }: ChatMessageProps) {
  const isAiMessage = role === "assistant";

  return (
    <div
      className={cn(
        "group mb-4 flex items-start gap-3",
        isAiMessage ? "justify-start" : "justify-end"
      )}
    >
      {isAiMessage && (
        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Bot size={16} className="text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isAiMessage 
            ? "bg-muted/50" 
            : "bg-primary text-background",
          "transition-all duration-200",
          isAiMessage ? "hover:bg-muted" : "hover:bg-primary/90"
        )}
      >
        <ReactMarkdown
          components={{
            a: ({ node, ref, ...props }) => (
              <Link
                {...props}
                href={props.href ?? ""}
                className={cn(
                  "font-medium underline",
                  isAiMessage ? "text-primary" : "text-background/80"
                )}
              />
            ),
            p: ({ node, ...props }) => (
              <p {...props} className="mt-2 first:mt-0" />
            ),
            ul: ({ node, ...props }) => (
              <ul
                {...props}
                className="mt-2 list-inside list-disc space-y-1"
              />
            ),
            li: ({ node, ...props }) => <li {...props} className="mt-1" />,
            code: ({ node, ...props }) => (
              <code
                {...props}
                className="rounded bg-foreground/10 px-1 py-0.5 font-mono text-sm"
              />
            )
          }}
          className="prose prose-sm dark:prose-invert"
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}