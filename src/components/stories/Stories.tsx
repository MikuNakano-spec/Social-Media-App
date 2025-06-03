"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "@/app/(main)/SessionProvider";
import kyInstance from "@/lib/ky";
import { StoryWithUserAndMedia } from "@/lib/types";
import { ChevronLeft, ChevronRight, Loader2, Plus, X } from "lucide-react";
import Image from "next/image";
import { useUploadThing } from "@/lib/uploadthing";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../ui/button";

export function Stories() {
  const { user } = useSession();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const {
    data: stories = [],
    refetch,
    isLoading,
    error,
  } = useQuery<StoryWithUserAndMedia[]>({
    queryKey: ["stories"],
    queryFn: async () => {
      try {
        const response = await kyInstance.get("/api/stories");
        if (!response.ok) throw new Error("Failed to fetch");
        return response.json();
      } catch (error) {
        console.error("Stories fetch error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load stories",
        });
        return [];
      }
    },
    staleTime: 60 * 1000,
  });

  const currentStory = stories[currentStoryIndex] || {
    media: [],
    user: { username: "Unknown", avatarUrl: "" },
  };

  const handleNextStory = useCallback(() => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setCurrentMediaIndex(0);
    } else {
      setIsOpen(false);
    }
    setProgress(0);
  }, [currentStoryIndex, stories.length]);

  const handlePrevStory = useCallback(() => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex((prev) => prev - 1);
    } else if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => {
        const newIndex = prev - 1;
        setCurrentMediaIndex(stories[newIndex]?.media?.length - 1 || 0);
        return newIndex;
      });
    }
    setProgress(0);
  }, [currentMediaIndex, currentStoryIndex, stories]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentMediaIndex < (currentStory.media?.length - 1 || 0)) {
            setCurrentMediaIndex((prev) => prev + 1);
            return 0;
          } else {
            handleNextStory();
            return 0;
          }
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, currentMediaIndex, currentStory.media?.length, handleNextStory]);

  if (isLoading) {
    return (
      <div className="mb-6 flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">
        Failed to load stories. Please try refreshing the page.
      </div>
    );
  }

  return (
    <div className="min-h-[50px]">
      <div className="scrollbar-hide flex gap-4 overflow-x-auto">
        {user && <CreateStory onSuccess={refetch} user={user} />}
        {stories.map((story, index) => (
          <StoryCircle
            key={story.id}
            story={story}
            onClick={() => {
              setCurrentStoryIndex(index);
              setCurrentMediaIndex(0);
              setIsOpen(true);
            }}
          />
        ))}
        {!isLoading && stories.length === 0 && user && (
          <div className="flex items-center px-4 italic text-gray-500">
            No stories available. Create your first story!
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl overflow-hidden border-none bg-black p-0">
          {currentStory && (
            <div className="relative h-[80vh] w-full">
              <div className="absolute left-4 right-4 top-4 z-10 flex gap-2">
                {currentStory.media?.map((_, index) => (
                  <div
                    key={index}
                    className="h-1 w-full overflow-hidden rounded-full bg-gray-600"
                  >
                    <div
                      className="duration-50 h-full bg-white transition-all"
                      style={{
                        width:
                          index === currentMediaIndex
                            ? `${progress}%`
                            : index < currentMediaIndex
                              ? "100%"
                              : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 z-10 rounded-full p-1 text-white hover:bg-white/10"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2">
                <button
                  onClick={handlePrevStory}
                  className="rounded-full p-2 text-white hover:bg-white/10"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
              </div>
              <div className="absolute right-4 top-1/2 z-10 -translate-y-1/2">
                <button
                  onClick={handleNextStory}
                  className="rounded-full p-2 text-white hover:bg-white/10"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </div>
              <div className="flex h-full flex-col items-center justify-center bg-black">
                {currentStory.media[currentMediaIndex]?.url ? (
                  currentStory.media[currentMediaIndex]?.type === "IMAGE" ? (
                    <Image
                      src={currentStory.media[currentMediaIndex].url}
                      alt="Story"
                      fill
                      className="object-contain"
                      priority
                    />
                  ) : (
                    <video
                      src={currentStory.media[currentMediaIndex].url}
                      controls
                      className="h-full w-full object-contain"
                      autoPlay
                      muted
                    />
                  )
                ) : (
                  <div className="p-4 text-center text-white">
                    <p className="text-xl font-semibold">No media available</p>
                    <p className="mt-2 text-sm">
                      This story contains no viewable content
                    </p>
                  </div>
                )}

                {currentStory.caption &&
                  (() => {
                    const [text, position] =
                      currentStory.caption.split("|POS:");
                    const [x = 50, y = 50] = (position || "")
                      .split(",")
                      .map(Number);

                    return (
                      <div
                        className="absolute z-20 rounded-lg bg-black/60 px-4 py-2 text-white backdrop-blur-sm"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        {position ? text : currentStory.caption}
                      </div>
                    );
                  })()}
              </div>
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
                <div className="relative h-8 w-8">
                  <Image
                    src={currentStory.user.avatarUrl || "/default-avatar.png"}
                    alt={currentStory.user.username}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <span className="font-medium text-white">
                  {currentStory.user.username}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const StoryCircle = ({
  story,
  onClick,
}: {
  story: StoryWithUserAndMedia;
  onClick: () => void;
}) => {
  const isExpired = new Date(story.expiresAt) < new Date();
  if (isExpired) return null;

  return (
    <button
      onClick={onClick}
      className="group relative shrink-0"
      aria-label={`View ${story.user.username}'s story`}
    >
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-tr from-purple-500 to-pink-500" />
        <div className="relative m-0.5 h-[calc(100%-4px)] w-[calc(100%-4px)]">
          <Image
            src={story.user.avatarUrl || "/default-avatar.png"}
            alt={story.user.username}
            fill
            className="rounded-full border-2 border-white object-cover"
          />
        </div>
      </div>
    </button>
  );
};

const CreateStory = ({
  onSuccess,
  user,
}: {
  onSuccess: () => void;
  user: any;
}) => {
  const { startUpload, isUploading } = useUploadThing("attachment");
  const { toast } = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current || !isDragging) return;

      const container = containerRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const x = ((clientX - container.left) / container.width) * 100;
      const y = ((clientY - container.top) / container.height) * 100;

      setPosition({
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(5, Math.min(95, y)),
      });
    },
    [isDragging],
  );

  useEffect(() => {
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("touchmove", handleDrag);
    return () => {
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("touchmove", handleDrag);
    };
  }, [handleDrag]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter(
      (file) =>
        file.type.startsWith("image/") ||
        (file.type.startsWith("video/") && file.size <= 50_000_000),
    );

    if (validFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "Invalid files",
        description: "Please select images or videos under 50MB",
      });
      return;
    }

    setSelectedFiles(validFiles);
    setPreviewOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePostStory = async () => {
    try {
      const uploaded = await startUpload(selectedFiles);
      if (!uploaded) return;

      const encodedCaption = `${caption}|POS:${position.x},${position.y}`;

      await kyInstance.post("/api/stories", {
        json: {
          mediaIds: uploaded.map((u) => u.serverData.mediaId),
          caption: encodedCaption,
        },
      });

      toast({ title: "Story created!" });
      onSuccess();
      setPreviewOpen(false);
      setCaption("");
      setPosition({ x: 50, y: 50 });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create story",
        description: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <div className="flex items-center">
      <label className="relative cursor-pointer">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-gray-600">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
      </label>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl border-none bg-black p-0">
          <div
            ref={containerRef}
            className="relative h-[80vh] w-full"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
          >
            {selectedFiles[0] && (
              <>
                {selectedFiles[0].type.startsWith("image") ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={URL.createObjectURL(selectedFiles[0])}
                      alt="Preview"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <video
                    src={URL.createObjectURL(selectedFiles[0])}
                    className="h-full w-full object-contain"
                    controls
                    autoPlay
                    muted
                  />
                )}
              </>
            )}
            <div
              className={`absolute cursor-grab rounded-lg bg-black/60 px-4 py-2 text-white backdrop-blur-sm transition-transform ${
                isDragging ? "scale-105 cursor-grabbing" : ""
              }`}
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 20,
              }}
            >
              {caption}
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-30 bg-black/80 p-4">
              <input
                type="text"
                placeholder="Add caption (drag to position)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full rounded-lg bg-white/10 p-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPreviewOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={handlePostStory}
                  disabled={isUploading}
                >
                  {isUploading ? "Posting..." : "Post Story"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
