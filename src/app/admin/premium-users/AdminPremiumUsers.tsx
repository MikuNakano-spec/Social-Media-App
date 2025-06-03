"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import kyInstance from "@/lib/ky";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { 
  generatePremiumExcelReport, 
  generatePremiumPdfReport,
  PremiumUserExportData 
} from "@/components/export/generatePremiumReports";
import { FiDownload } from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PremiumUser {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  createdAt: Date;
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: Date;
  } | null;
}

interface PremiumUsersResponse {
  premiumUsers: PremiumUser[];
  total: number;
  page: number;
  limit: number;
  mrr: number;
  arpu: number;
}

export default function AdminPremiumUsers() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);
  const perPage = 5;

  const { data, isLoading, error } = useQuery<PremiumUsersResponse>({
    queryKey: ["premium-users", searchTerm, page],
    queryFn: async () => {
      const res = await kyInstance.get(
        `/api/admin/premium-users?search=${searchTerm}&page=${page}&limit=${perPage}`,
      );
      return res.json();
    },
  });

  const users = data?.premiumUsers ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleExportPremium = async (type: "excel" | "pdf") => {
    try {
      setIsExporting(type);
      const response = await kyInstance.get(
        `/api/admin/premium-users?search=${searchTerm}&export=true`
      );
      const data: PremiumUsersResponse = await response.json<PremiumUsersResponse>();
      
      const exportData: PremiumUserExportData[] = data.premiumUsers.map((user: PremiumUser) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt.toISOString(),
        plan: user.subscription?.plan || "—",
        status: user.subscription?.status || "—",
        renewalDate: user.subscription?.currentPeriodEnd 
          ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString() 
          : "—"
      }));

      if (type === "excel") {
        generatePremiumExcelReport(exportData);
      } else {
        generatePremiumPdfReport(exportData);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(null);
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading premium users.</p>;

  return (
    <div className="bg-white p-6 shadow">
      <h2 className="mb-3 text-xl font-bold"></h2>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <h3 className="text-sm font-medium text-blue-800">
            Monthly Revenue (MRR)
          </h3>
          <p className="text-2xl font-semibold text-blue-600">
            {data?.mrr?.toLocaleString("vi-VN", {
              style: "currency",
              currency: "VND",
            }) || "₫0"}
          </p>
        </div>

        <div className="rounded-lg border border-green-100 bg-green-50 p-4">
          <h3 className="text-sm font-medium text-green-800">
            Avg Revenue/User (ARPU)
          </h3>
          <p className="text-2xl font-semibold text-green-600">
            {data?.arpu?.toLocaleString("vi-VN", {
              style: "currency",
              currency: "VND",
            }) || "₫0"}
          </p>
        </div>
      </div>

      <div className="mb-3 flex gap-2">
        <Input
          placeholder="Search by username/email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button
          onClick={handleSearch}
          variant="outline" 
          className="gap-2"
        >
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
                    Export
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExportPremium("excel")}>
                Export to Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportPremium("pdf")}>
                Export to PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Username</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Plan</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Renewal</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.username}</td>
              <td className="p-2">{u.email ?? "—"}</td>
              <td className="p-2">{u.subscription?.plan ?? "—"}</td>
              <td className="p-2">{u.subscription?.status ?? "—"}</td>
              <td className="p-2">
                {u.subscription?.currentPeriodEnd
                  ? new Date(
                      u.subscription.currentPeriodEnd,
                    ).toLocaleDateString()
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
    </div>
  );
}
