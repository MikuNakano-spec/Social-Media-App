import { useEffect, useRef, useState } from "react";
import {
  Call,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import useInitializeVideoClient from "./useInitializeVideoClient";

interface VideoCallChatProps {
  isOpen: boolean;
  onClose: () => void;
  callId: string;
  isInitiator: boolean;
}

export default function VideoCallChat({
  isOpen,
  onClose,
  callId,
  isInitiator,
}: VideoCallChatProps) {
  const videoClient = useInitializeVideoClient();
  const callRef = useRef<Call | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [callStatus, setCallStatus] = useState("Initializing...");
  const [hasJoined, setHasJoined] = useState(false);
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  useEffect(() => {
    if (!videoClient || !isOpen) return;
  
    const newCall = videoClient.call("default", callId);
    callRef.current = newCall;
    setCall(newCall);
    setHasJoined(false);
    setCallStatus("Initializing...");
  
    const initializeCall = async () => {
      try {
        if (isInitiator) {
          await newCall.create();
          await newCall.join();
          setHasJoined(true);
          setCallStatus("Connected");
        } else {
          const result = await newCall.get();
          if (result) {
            setCallStatus("Incoming call...");
          }
        }
      } catch (err) {
        console.error("Error setting up call:", err);
        setCallStatus("Call not found or failed to connect");
      }
    };
  
    initializeCall();
  
    return () => {
      newCall.leave()
        .then(() => {
          console.log("Left call successfully");
        })
        .catch(err => console.warn("Error leaving call:", err));
      setCall(null);
      setHasJoined(false);
      setCallStatus("Disconnected");
      callRef.current = null;
    };
  }, [videoClient, isOpen, callId, isInitiator]);

  const handleJoinCall = async () => {
    if (!callRef.current) return;
    try {
      await callRef.current.join();
      setHasJoined(true);
      setCallStatus("Connected");
    } catch (err) {
      console.error("Failed to join call:", err);
      setCallStatus("Failed to join");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Video Call</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-500">{callStatus}</p>

        {call && (
          <StreamCall call={call}>
            <StreamTheme>
              <SpeakerLayout />
              {!isInitiator && !hasJoined ? (
                <Button onClick={handleJoinCall} className="mt-4">
                  Join Call
                </Button>
              ) : (
                <CallControls />
              )}
            </StreamTheme>
          </StreamCall>
        )}
      </DialogContent>
    </Dialog>
  );
}
