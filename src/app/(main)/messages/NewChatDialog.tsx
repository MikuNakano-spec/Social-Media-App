import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { DefaultStreamChatGenerics, useChatContext } from "stream-chat-react";
import { useSession } from "../SessionProvider";
import { useState } from "react";
import useDebounce from "@/hooks/useDebounce";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Loader2, SearchIcon, X } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import LoadingButton from "@/components/LoadingButton";

interface APIUser {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

interface NewChatDialogProps {
  onOpenChange: (open: boolean) => void;
  onChatCreated: () => void;
}

export default function NewChatDialog({
  onOpenChange,
  onChatCreated,
}: NewChatDialogProps) {
  const { client, setActiveChannel } = useChatContext();
  const { toast } = useToast();
  const { user: loggedInUser } = useSession();

  const [searchInput, setSearchInput] = useState("");
  const searchInputDebounced = useDebounce(searchInput);

  const [selectedUsers, setSelectedUsers] = useState<APIUser[]>([]);

  const { data, isFetching, isError, isSuccess } = useQuery<APIUser[]>({
    queryKey: ["api-stream-users", searchInputDebounced],
    queryFn: async () => {
      const response = await fetch(
        `/api/stream-users?q=${encodeURIComponent(searchInputDebounced)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      return data.users;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const channel = client.channel("messaging", {
        members: [loggedInUser.id, ...selectedUsers.map((u) => u.id)],
        name:
          selectedUsers.length > 1
            ? loggedInUser.displayName +
              ", " +
              selectedUsers.map((u) => u.displayName).join(", ")
            : undefined,
      });
      await channel.create();
      return channel;
    },
    onSuccess: (channel) => {
      setActiveChannel(channel);
      onChatCreated();
      onOpenChange(false);
    },
    onError(error) {
      console.error("Error starting chat", error);
      toast({
        variant: "destructive",
        description: "Error starting chat. Please try again.",
      });
    },
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="bg-card p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>New Chat</DialogTitle>
        </DialogHeader>
        <div className="px-6">
          <div className="group relative">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 transform text-muted-foreground group-focus-within:text-primary" />
            <input
              placeholder="Search users..."
              className="h-10 w-full rounded-md border bg-background px-10 text-sm focus:outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          
          {!!selectedUsers.length && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <SelectedUserTag
                  key={user.id}
                  user={user}
                  onRemove={() => {
                    setSelectedUsers((prev) =>
                      prev.filter((u) => u.id !== user.id),
                    );
                  }}
                />
              ))}
            </div>
          )}
        </div>
        
        <hr className="my-4" />
        
        <div className="h-96 overflow-auto px-2">
          {isSuccess && data && data.length > 0 ? (
            data.map((user) => (
              <UserResult
                key={user.id}
                user={user}
                selected={selectedUsers.some((u) => u.id === user.id)}
                onClick={() => {
                  setSelectedUsers((prev) =>
                    prev.some((u) => u.id === user.id)
                      ? prev.filter((u) => u.id !== user.id)
                      : [...prev, user]
                  );
                }}
              />
            ))
          ) : isSuccess ? (
            <p className="my-3 text-center text-muted-foreground">
              No users found. Try a different name.
            </p>
          ) : null}
          
          {isFetching && (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin" />
            </div>
          )}
          
          {isError && (
            <p className="my-3 text-center text-destructive">
              An error occurred while loading users.
            </p>
          )}
        </div>
        
        <DialogFooter className="px-6 pb-6">
          <LoadingButton
            disabled={!selectedUsers.length}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Start chat
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UserResultProps {
  user: APIUser;
  selected: boolean;
  onClick: () => void;
}

function UserResult({ user, selected, onClick }: UserResultProps) {
  return (
    <button
      className="flex w-full items-center justify-between px-4 py-2.5 transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <UserAvatar avatarUrl={user.avatarUrl} />
        <div className="flex flex-col text-start">
          <p className="font-bold">{user.displayName}</p>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>
      </div>
      {selected && <Check className="size-5 text-green-500" />}
    </button>
  );
}

interface SelectedUserTagProps {
  user: APIUser;
  onRemove: () => void;
}

function SelectedUserTag({ user, onRemove }: SelectedUserTagProps) {
  return (
    <button
      onClick={onRemove}
      className="flex items-center gap-2 rounded-full border p-1 hover:bg-muted/50"
    >
      <UserAvatar avatarUrl={user.avatarUrl} size={24} />
      <p className="font-bold">{user.displayName}</p>
      <X className="mx-2 size-5 text-muted-foreground" />
    </button>
  );
}