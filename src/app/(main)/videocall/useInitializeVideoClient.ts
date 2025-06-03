import { useEffect, useState } from "react";
import { StreamVideoClient } from "@stream-io/video-react-sdk";
import { useSession } from "../SessionProvider";
import kyInstance from "@/lib/ky";

export default function useInitializeVideoClient() {
  const { user } = useSession();
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);

  useEffect(() => {
    if (!user?.id) return; 

    const client = new StreamVideoClient(process.env.NEXT_PUBLIC_STREAM_KEY!);

    const connectUser = async () => {
      try {
        const { token } = await kyInstance.get("/api/get-token").json<{ token: string }>();
        console.log("Video token received:", token); 
        await client.connectUser(
          {
            id: user.id,
            name: user.displayName,
            image: user.avatarUrl ?? undefined,
          },
          token
        );
        setVideoClient(client);
      } catch (error) {
        console.error("Failed to connect video client", error);
      }
    };

    connectUser();

    return () => {
      client.disconnectUser().catch(console.error);
      setVideoClient(null);
    };
  }, [user]); 

  return videoClient;
}
