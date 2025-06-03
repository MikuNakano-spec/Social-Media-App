"use client";

import { Loader2 } from "lucide-react";
import useInitializeChatClient from "./useInitializeChatClient";
import { Chat as StreamChat } from "stream-chat-react";
import ChatSidebar from "./ChatSidebar";
import ChatChannel from "./ChatChannel";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import AIChatButton from "@/components/AIChatButton";
import VideoCallChat from "../videocall/VideoCallChat";

export default function Chat() {
  const chatClient = useInitializeChatClient();
  const { resolvedTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [isInitiator, setIsInitiator] = useState(false);

  useEffect(() => {
    if (!chatClient) return;
  
    const handleMessage = (event: any) => {
      if (event.message.custom?.callAction === 'start') {
        setCallId(event.message.custom.callId);
        setCallOpen(true);
        setIsInitiator(false);
      }
    };
  
    chatClient.on('message.new', handleMessage);
    return () => chatClient.off('message.new', handleMessage);
  }, [chatClient]);
  

  function startCall(id: string, initiator: boolean) {
    setCallId(id);
    setCallOpen(true);
    setIsInitiator(initiator);
  }

  if (!chatClient) {
    return <Loader2 className="animate-spin mx-auto my-3" />;
  }

  return (
    <main className="relative w-full overflow-hidden rounded-2xl bg-card shadow-sm">
      <div className="absolute right-0 top-1 z-10">
        <AIChatButton />
      </div>
      <div className="absolute bottom-0 top-0 flex w-full">
        <StreamChat
          client={chatClient}
          theme={
            resolvedTheme === "dark"
              ? "str-chat__theme-dark"
              : "str-chat__theme-light"
          }
        >
          <ChatSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <ChatChannel
            open={!sidebarOpen}
            openSidebar={() => setSidebarOpen(true)}
            startCall={startCall}
          />
        </StreamChat>
      </div>
      {callId && (
        <VideoCallChat
          isOpen={callOpen}
          onClose={() => setCallOpen(false)}
          callId={callId}
          isInitiator={isInitiator}
        />
      )}
    </main>
  );
}