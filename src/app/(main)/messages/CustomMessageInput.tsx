"use client";

import { useRef, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function CustomMessageInput() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { channel } = useChatContext();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const { startUpload, isUploading } = useUploadThing("attachment");

  const handlePasteOrDrop = (fileList: FileList | null) => {
    if (!fileList) return;
    const imageFiles = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (imageFiles.length === 0) return;

    setFiles(imageFiles);
    const objectUrls = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviews(objectUrls);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handlePasteOrDrop(e.dataTransfer.files);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    handlePasteOrDrop(e.clipboardData.files);
  };

  const handleSend = async () => {
    let attachments: {
      type: "image";
      image_url: string;
    }[] = [];

    if (files.length > 0) {
      const uploaded = await startUpload(files);
      if (uploaded) {
        attachments = uploaded.map((file) => ({
          type: "image",
          image_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/media/${file.serverData.mediaId}`,
        }));
      }
    }

    if (!text.trim() && attachments.length === 0) return;

    await channel?.sendMessage({
      text,
      attachments,
    });

    setText("");
    setFiles([]);
    setPreviews([]);
  };

  const removeImage = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="border-t border-gray-200 p-2"
      onDrop={handleDrop}
      onPaste={handlePaste}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => e.preventDefault()}
    >
      {previews.length > 0 && (
        <div className="mb-2 flex gap-2">
          {previews.map((url, idx) => (
            <div key={idx} className="relative">
              <Image
                src={url}
                alt="preview"
                width={80}
                height={80}
                className="rounded object-cover"
              />
              <button
                className="absolute right-0 top-0 rounded bg-black bg-opacity-50 px-1 text-white"
                onClick={() => removeImage(idx)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          className="flex-1 resize-none rounded border px-3 py-2 max-h-40 overflow-auto"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (inputRef.current) {
              inputRef.current.style.height = "auto";
              inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
        />
        <Button onClick={handleSend} disabled={isUploading}>
          {isUploading ? "Uploading..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
