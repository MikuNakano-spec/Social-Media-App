import { useState } from "react";
import { Button } from "./ui/button";
import AIChatBox from "./AIChatBox";
import { Bot } from "lucide-react";

export default function AIChatButton() {
  const [chatBoxOpen, setChatBoxOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setChatBoxOpen(true)}
        className=" flex items-center gap-2 rounded-full bg-primary px-3 py-3 text-lg font-medium text-background shadow-2xl transition-all hover:bg-primary/90 hover:shadow-lg"
      >
        <Bot size={24} className="h-6 w-6" />
        <span>AI Chat</span>
      </Button>
      <AIChatBox open={chatBoxOpen} onClose={() => setChatBoxOpen(false)} />
    </>
  );
}