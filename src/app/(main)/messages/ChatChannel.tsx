import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, PhoneCall } from "lucide-react";
import {
  Channel,
  ChannelHeader,
  ChannelHeaderProps,
  MessageInput,
  MessageList,
  Window,
  useChannelStateContext,
} from "stream-chat-react";
import { useSession } from "../SessionProvider";

interface ChatChannelProps {
  open: boolean;
  openSidebar: () => void;
  startCall: (id: string, isInitiator: boolean) => void;
}

export default function ChatChannel({
  open,
  openSidebar,
  startCall,
}: ChatChannelProps) {
  return (
    <div className={cn("w-full md:block", !open && "hidden")}>
      <Channel>
        <Window>
          <CustomChannelHeader
            openSidebar={openSidebar}
            startCall={startCall}
          />
          <MessageList />
          <MessageInput />
        </Window>
      </Channel>
    </div>
  );
}

interface CustomChannelHeaderProps extends ChannelHeaderProps {
  openSidebar: () => void;
  startCall: (id: string, isInitiator: boolean) => void;
}

function CustomChannelHeader({
  openSidebar,
  startCall,
  ...props
}: CustomChannelHeaderProps) {
  const { channel } = useChannelStateContext();
  const { user } = useSession();

  const handleVideoCall = async () => {
    if (!user || !channel) return;

    const members = Object.values(channel.state.members);
    const otherMember = members.find(m => m.user_id !== user.id);
    if (!otherMember) return;

    const sortedIds = [user.id, otherMember.user_id].sort();
    const callId = `call_${sortedIds[0]}_${sortedIds[1]}`;

    try {
      await channel.sendMessage({
        text: 'Incoming video call', 
        type: 'regular',
        custom: {
          callAction: 'start',
          callId
        }
      });
      startCall(callId, true);
    } catch (err) {
      console.error('Failed to start call:', err);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="h-full p-2 md:hidden">
        <Button size="icon" variant="ghost" onClick={openSidebar}>
          <Menu className="size-5" />
        </Button>
      </div>
      <ChannelHeader {...props} />
      <Button
        size="icon"
        variant="ghost"
        onClick={handleVideoCall}
      >
        <PhoneCall className="size-5" />
      </Button>
    </div>
  );
}