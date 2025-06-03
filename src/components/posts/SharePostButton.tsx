"use client";

import { useState } from "react";
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
} from "next-share";
import { Share2 } from "lucide-react";
import { FaFacebook, FaTwitter, FaWhatsapp } from "react-icons/fa";

interface ShareButtonProps {
  postId: string;
  postContent: string;
}

export default function ShareButton({ postId, postContent }: ShareButtonProps) {
  const [showShareOptions, setShowShareOptions] = useState(false);

  const postUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/posts/${postId}`;
  const postTitle = postContent.substring(0, 50);

  return (
    <div className="relative">
      <button
        onClick={() => setShowShareOptions(!showShareOptions)}
        className="flex items-center gap-2"
      >
        <Share2 className="size-5" />
        <span className="text-sm font-medium hidden sm:inline">Share</span>
      </button>

      {showShareOptions && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-md p-2">
          <FacebookShareButton url={postUrl} quote={postTitle}>
          <div className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
              <FaFacebook className="text-blue-600" />
              <span>Facebook</span>
            </div>
          </FacebookShareButton>
          <TwitterShareButton url={postUrl} title={postTitle}>
          <div className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
              <FaTwitter className="text-blue-400" />
              <span>Twitter</span>
            </div>
          </TwitterShareButton>
          <WhatsappShareButton url={postUrl} title={postTitle}>
          <div className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
              <FaWhatsapp className="text-green-500" />
              <span>WhatsApp</span>
            </div>
          </WhatsappShareButton>
        </div>
      )}
    </div>
  );
}
