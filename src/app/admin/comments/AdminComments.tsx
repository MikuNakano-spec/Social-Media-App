"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import kyInstance from "@/lib/ky";
import {
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { 
  generateCommentsExcelReport, 
  generateCommentsPdfReport,
  CommentExportData 
} from "@/components/export/generateCommentReports";
import { FiDownload } from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    username: string;
  };
  post: {
    id: string;
    content: string;
  };
}

interface CommentData {
  comments: Comment[];
  total: number;
  currentUserRole?: string;
}

enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR",
  GUEST = "GUEST",
  USER = "USER",
}

export default function AdminComments() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.GUEST);
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);
  const limit = 5;

  const { data, isLoading, error } = useQuery<CommentData>({
    queryKey: ["admin-comments", searchTerm, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
      });
      const res = await kyInstance
        .get(`/api/admin/comments?${params}`)
        .json<CommentData>();
      if (res.currentUserRole) setUserRole(res.currentUserRole as UserRole);
      return res;
    },
  });

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      await kyInstance.patch(`/api/admin/comments/${id}`, {
        json: { content },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      setEditingComment(null);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      await kyInstance.delete(`/api/admin/comments/${id}`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] }),
  });

  const handleExportComments = async (type: "excel" | "pdf") => {
    try {
      setIsExporting(type);
      const response = await kyInstance.get(
        `/api/admin/comments?search=${searchTerm}&export=true`
      );
      const data: CommentData = await response.json<CommentData>();
      
      const exportData: CommentExportData[] = data.comments.map((comment: Comment) => ({
        id: comment.id,
        username: comment.user.username,
        content: comment.content,
        createdAt: comment.createdAt,
        postContent: comment.post.content,
        postId: comment.post.id
      }));

      if (type === "excel") {
        generateCommentsExcelReport(exportData);
      } else {
        generateCommentsPdfReport(exportData);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(null);
    }
  };

  const comments = data?.comments ?? [];
  const totalComments = data?.total ?? 0;
  const totalPages = Math.ceil(totalComments / limit);

  if (isLoading)
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );

  if (error)
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">
        Failed to load comments
      </div>
    );

  return (
    <TooltipProvider>
      <div className="bg-white p-6 shadow-md">
        <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-gray-800"></h1>
          <div className="flex w-full gap-2 sm:w-auto">
            <Input
              placeholder="Search comments..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="max-w-md"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onBlur={handleSearch}
            />
            <Button onClick={() => setCurrentPage(1)} variant="outline">
              <Search className="h-4 w-4" />
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
                      Export Comments
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExportComments("excel")}>
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportComments("pdf")}>
                  Export to PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-700">
                  Content
                </th>
                <th className="p-3 text-left text-sm font-medium text-gray-700">
                  Author
                </th>
                <th className="p-3 text-left text-sm font-medium text-gray-700">
                  Post
                </th>
                <th className="p-3 text-left text-sm font-medium text-gray-700">
                  Date
                </th>
                <th className="p-3 text-center text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {comments.map((comment) => (
                <tr
                  key={comment.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="max-w-[300px] p-3">
                    {editingComment?.id === comment.id ? (
                      <Input
                        value={editingComment.content}
                        onChange={(e) =>
                          setEditingComment({
                            ...editingComment,
                            content: e.target.value,
                          })
                        }
                        className="w-full"
                      />
                    ) : (
                      <div className="truncate text-sm">{comment.content}</div>
                    )}
                  </td>
                  <td className="p-3 text-sm font-medium text-gray-800">
                    {comment.user.username}
                  </td>
                  <td className="max-w-[200px] p-3">
                    <div className="truncate text-sm text-gray-600">
                      {comment.post.content}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    {userRole !== UserRole.GUEST && (
                      <div className="flex justify-center gap-2">
                        {editingComment?.id === comment.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                updateCommentMutation.mutate({
                                  id: comment.id,
                                  content: editingComment.content,
                                })
                              }
                              disabled={updateCommentMutation.isPending}
                            >
                              {updateCommentMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Save"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingComment(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Tooltip>
                              <TooltipTrigger>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingComment(comment)}
                                  className="text-blue-600 hover:bg-blue-50"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit comment</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    deleteCommentMutation.mutate(comment.id)
                                  }
                                  disabled={deleteCommentMutation.isPending}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  {deleteCommentMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete comment</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-center gap-3">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2.5"
          >
            <ChevronLeft className="h-3 w-3" />
            <span className="sr-only sm:not-sr-only">Prev</span>
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages || comments.length < limit}
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2.5"
          >
            <span className="sr-only sm:not-sr-only">Next</span>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
