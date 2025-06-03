"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import kyInstance from "@/lib/ky";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  generateReportsExcelReport, 
  generateReportsPdfReport,
  ReportExportData 
} from "@/components/export/generateReportReports";
import { FiDownload } from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Report {
  id: string;
  postId: string | null;
  commentId: string | null;
  postContent: string | null;
  commentContent: string | null;
  user: {
    username: string;
  };
  status: string;
  createdAt: string;
}

interface ReportData {
  reports: Report[];
  total: number;
}

export default function AdminReports() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);
  const limit = 3;

  const { data, isLoading, error } = useQuery<ReportData>({
    queryKey: ["reports", statusFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());
      params.append("includeContent", "true");

      return kyInstance
        .get(`/api/admin/reports?${params.toString()}`)
        .json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await kyInstance.patch("/api/admin/reports", { json: { id, status } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const toggleExpandReport = (reportId: string) => {
    setExpandedReportId(expandedReportId === reportId ? null : reportId);
  };

  const handleExportReports = async (type: "excel" | "pdf") => {
    try {
      setIsExporting(type);
      const response = await kyInstance.get(
        `/api/admin/reports?status=${statusFilter}&export=true`
      );
      const data: ReportData = await response.json<ReportData>();
      
      const exportData: ReportExportData[] = data.reports.map((report: Report) => ({
        id: report.id,
        reportType: report.postId ? "Post" : "Comment",
        reportedItemId: report.postId || report.commentId || "N/A",
        content: report.postId 
          ? report.postContent || "No content available" 
          : report.commentContent || "No content available",
        username: report.user.username,
        status: report.status,
        createdAt: report.createdAt
      }));

      if (type === "excel") {
        generateReportsExcelReport(exportData);
      } else {
        generateReportsPdfReport(exportData);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(null);
    }
  };

  const reports = data?.reports ?? [];
  const totalReports = data?.total ?? 0;
  const totalPages = Math.ceil(totalReports / limit);

  if (isLoading) return <p>Loading reports...</p>;
  if (error) return <p className="text-red-500">Failed to load reports</p>;

  return (
    <div className=" bg-white p-6 shadow-md">
      <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <h2 className="text-xl font-bold"></h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            className="border rounded-md p-2 text-sm"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            value={statusFilter}
          >
            <option value="">All Reports</option>
            <option value="PENDING">Pending</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="RESOLVED">Resolved</option>
          </select>
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
                    Export Reports
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExportReports("excel")}>
                Export to Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportReports("pdf")}>
                Export to PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 text-left">Report ID</th>
            <th className="p-2 text-left">Post/Comment</th>
            <th className="p-2 text-left">User</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <React.Fragment key={report.id}>
              <tr className="border-b">
                <td className="p-2">{report.id}</td>
                <td className="p-2">
                  <div className="flex flex-col">
                    {report.postId && (
                      <span className="font-medium">Post #{report.postId}</span>
                    )}
                    {report.commentId && (
                      <span className="font-medium">Comment #{report.commentId}</span>
                    )}
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-left"
                      onClick={() => toggleExpandReport(report.id)}
                    >
                      {expandedReportId === report.id ? 'Hide content' : 'Show content'}
                    </Button>
                  </div>
                </td>
                <td className="p-2">{report.user.username}</td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      report.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : report.status === "REVIEWED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {report.status}
                  </span>
                </td>
                <td className="p-2">
                  <select
                    className="border rounded-md p-2 text-sm w-full"
                    value={report.status}
                    onChange={(e) =>
                      updateStatusMutation.mutate({
                        id: report.id,
                        status: e.target.value,
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </td>
              </tr>

              {expandedReportId === report.id && (
                <tr className="border-b bg-gray-50">
                  <td colSpan={5} className="p-2">
                    <div className="bg-white p-4 rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">
                          {report.commentId ? "Comment Content" : "Post Content"}:
                        </h4>
                        <span className="text-sm text-gray-500">
                          Reported on: {new Date(report.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-gray-100 p-3 rounded">
                        {report.postId && (
                          <>
                            <h4 className="font-medium">Post Content:</h4>
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {report.postContent || "No content available"}
                            </p>
                          </>
                        )}
                        {report.commentId && (
                          <>
                            <h4 className="font-medium">Comment Content:</h4>
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {report.commentContent || "No content available"}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

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
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || reports.length < limit}
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2.5"
          >
            <span className="sr-only sm:not-sr-only">Next</span>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
    </div>
  );
}
