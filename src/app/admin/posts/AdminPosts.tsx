"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import kyInstance from "@/lib/ky";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Trash2,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Play,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  generatePostsExcelReport,
  generatePostsPdfReport,
  PostExportData,
} from "@/components/export/generatePostReports";
import { FiDownload } from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Post {
  id: string;
  content: string;
  createdAt: Date;
  attachments: {
    id: string;
    url: string;
    type: "IMAGE" | "VIDEO";
  }[];
  user: {
    username: string;
  };
}

interface AdminPostsResponse {
  posts: Post[];
  totalPosts: number;
  page: number;
  limit: number;
  currentUserRole?: Role;
}

enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
  MODERATOR = "MODERATOR",
  GUEST = "GUEST",
}

function MediaPreviews({ attachments }: { attachments: Post["attachments"] }) {
  return (
    <div
      className={cn(
        "flex max-w-[200px] gap-2 overflow-x-auto pb-2",
        attachments.length > 1 &&
          "scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent",
      )}
    >
      {attachments.map((media) => (
        <Link
          key={media.id}
          href={media.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative shrink-0"
        >
          {media.type === "IMAGE" ? (
            <div className="relative h-16 w-16">
              <Image
                src={media.url}
                alt="Post attachment"
                fill
                className="rounded-md border object-cover transition-transform hover:scale-105"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
              <span className="text-xs text-muted-foreground">VIDEO</span>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}

function PostDetailModal({
  post,
  onClose,
}: {
  post: Post;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!post} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-lg bg-white p-0 shadow-xl">
        <DialogHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            <span className="rounded-lg bg-blue-100 p-2 text-blue-800">
              <Eye className="h-5 w-5" />
            </span>
            Post Details
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-gray-600">
            Full post information including content, author, and media
            attachments
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                Author
              </h4>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl border-2 border-dashed bg-gray-200" />
                <p className="text-base font-medium text-gray-900">
                  {post.user.username}
                </p>
              </div>
            </div>
            <div>
              <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                Created At
              </h4>
              <p className="text-base text-gray-700">
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
              Content
            </h4>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="whitespace-pre-wrap text-gray-800">
                {post.content || (
                  <span className="italic text-gray-400">
                    No content available
                  </span>
                )}
              </p>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Attachments
              </h4>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                {post.attachments.length}{" "}
                {post.attachments.length === 1 ? "item" : "items"}
              </span>
            </div>
            {post.attachments.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {post.attachments.map((media) => (
                  <Link
                    key={media.id}
                    href={media.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block overflow-hidden rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-md"
                  >
                    {media.type === "IMAGE" ? (
                      <div className="aspect-square">
                        <Image
                          src={media.url}
                          alt="Post attachment"
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 25vw"
                        />
                      </div>
                    ) : (
                      <div className="relative flex aspect-square flex-col items-center justify-center bg-gray-100">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="z-10 rounded-full bg-red-500 p-3">
                          <Play className="h-6 w-6 fill-current text-white" />
                        </div>
                        <span className="z-10 mt-2 text-xs font-medium text-gray-500">
                          Video
                        </span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-8 text-center">
                <p className="text-gray-500">No attachments found</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end border-t bg-gray-50 px-6 py-3">
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPosts() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const postsPerPage = 4;
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const closeModal = () => setSelectedPost(null);
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleExportPosts = async (type: "excel" | "pdf") => {
    try {
      setIsExporting(type);
      const response = await kyInstance.get(
        `/api/admin/posts?search=${searchTerm}&export=true`,
      );
      const data: PostExportData[] = await response.json();

      if (type === "excel") {
        generatePostsExcelReport(data);
      } else {
        generatePostsPdfReport(data);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(null);
    }
  };

  const { data, error, isLoading } = useQuery<AdminPostsResponse>({
    queryKey: ["admin-posts", searchTerm, page],
    queryFn: async () => {
      const response = await kyInstance.get(
        `/api/admin/posts?search=${searchTerm}&page=${page}&limit=${postsPerPage}`,
      );
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      await kyInstance.delete("/api/admin/posts", { json: { postId } });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] }),
  });

  const posts = data?.posts ?? [];
  const totalPosts = data?.totalPosts ?? 0;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  const currentUserRole = data?.currentUserRole;

  if (isLoading) return <p className="p-4 text-center">Loading posts...</p>;
  if (error)
    return <p className="p-4 text-center text-red-500">Failed to load posts</p>;

  return (
    <div className="bg-white p-6 shadow-md">
      <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-800"></h2>
        <div className="flex w-full gap-2 sm:w-auto">
          <Input
            type="text"
            placeholder="Search posts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSearch}
            className="max-w-md flex-1"
          />
          <Button onClick={handleSearch} variant="outline" className="gap-2">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting !== null}>
                {isExporting ? (
                  <span className="flex items-center">
                    Exporting {isExporting === "excel" ? "Excel" : "PDF"}...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FiDownload className="h-4 w-4" />
                    Export Posts
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExportPosts("excel")}>
                Export to Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportPosts("pdf")}>
                Export to PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full">
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[25%]" />
            <col className="w-[25%]" />
            <col className="w-[20%]" />
            {currentUserRole !== Role.GUEST && <col className="w-[15%]" />}
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              {[
                "Author",
                "Content",
                "Media",
                "Created At",
                currentUserRole !== Role.GUEST && "Actions",
              ].map((header, index) => (
                <th
                  key={index}
                  className="p-3 text-left text-sm font-semibold text-gray-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {posts.map((post) => (
              <tr key={post.id} className="transition-colors hover:bg-gray-50">
                <td className="p-3 text-sm font-medium text-gray-800">
                  {post.user.username}
                </td>
                <td className="max-w-xs truncate p-3 text-sm text-gray-700">
                  {post.content}
                </td>
                <td className="p-3">
                  {post.attachments.length > 0 ? (
                    <MediaPreviews attachments={post.attachments} />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No media
                    </span>
                  )}
                </td>
                <td className="p-3 text-sm text-gray-500">
                  {new Date(post.createdAt).toLocaleString()}
                </td>
                {currentUserRole !== Role.GUEST && (
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(post.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="sr-only">Delete post</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedPost(post)}
                        className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View details</span>
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <Button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 px-2.5"
        >
          <ChevronLeft className="h-3 w-3" />
          <span className="sr-only sm:not-sr-only">Prev</span>
        </Button>
        <span className="text-xs text-gray-600">
          Page {page} of {totalPages}
        </span>
        <Button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 px-2.5"
        >
          <span className="sr-only sm:not-sr-only">Next</span>
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
      {selectedPost && (
        <PostDetailModal post={selectedPost} onClose={closeModal} />
      )}
    </div>
  );
}
