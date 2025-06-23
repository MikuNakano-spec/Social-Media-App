import { useChatContext } from "stream-chat-react";
import { Channel, ChannelMemberResponse } from "stream-chat";
import { Button } from "@/components/ui/button";
import { useSession } from "../SessionProvider";
import { useState } from "react";

interface ConversationActionsProps {
  channel: Channel;
}

export default function ConversationActions({ channel }: ConversationActionsProps) {
  const { client } = useChatContext();
  const { user } = useSession();
  const [loading, setLoading] = useState(false);

  const members = channel.state.members as Record<string, ChannelMemberResponse>;
  const otherUser = Object.values(members).find((m) => m.user?.id !== user.id)?.user?.id;

  const blockUser = async () => {
    try {
      setLoading(true);
      if (otherUser) {
        await client.banUser(otherUser);
        alert("User blocked from DMs.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to block user.");
    } finally {
      setLoading(false);
    }
  };

  const muteUser = async () => {
    try {
      setLoading(true);
      if (otherUser) {
        await client.muteUser(otherUser);
        alert("Notifications muted.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to mute user.");
    } finally {
      setLoading(false);
    }
  };

  const leaveConversation = async () => {
    try {
      setLoading(true);
      await channel.removeMembers([user.id]);
      alert("Left the conversation.");
    } catch (err) {
      console.error(err);
      alert("Failed to leave conversation.");
    } finally {
      setLoading(false);
    }
  };

  const reportUser = async () => {
    try {
      setLoading(true);
      if (otherUser) {
        await fetch("/api/report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reporter: user.id, reported: otherUser }),
        });
        alert("User reported.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to report user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 p-4">
      <h2 className="text-lg font-semibold">Conversation Options</h2>
      <Button variant="outline" disabled={loading} onClick={muteUser}>
        Snooze Notifications
      </Button>
      <Button variant="outline" disabled={loading} onClick={blockUser}>
        Block DMs
      </Button>
      <Button variant="outline" disabled={loading} onClick={reportUser}>
        Report
      </Button>
      <Button variant="destructive" disabled={loading} onClick={leaveConversation}>
        Leave Conversation
      </Button>
    </div>
  );
}
