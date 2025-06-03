"use client";

import kyInstance from "@/lib/ky";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState } from "react";
import {
  FiUsers,
  FiFileText,
  FiAlertCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiDownload,
  FiBarChart2,
  FiPieChart,
} from "react-icons/fi";
import { generateExcelReport } from "@/components/export/generateExcelReport";
import { generatePdfReport } from "@/components/export/generatePdfReport";

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  reportedPosts: number;
  totalRevenue: number;
  activeSubscriptions: number;
  bannedUsers: number;
  growthData: {
    month: string;
    users: number;
    posts: number;
    reports: number;
  }[];
  trends?: {
    users: number;
    posts: number;
    reported: number;
  };
}

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  role: string;
  isBanned: boolean;
  createdAt: Date;
  bio?: string | null;
  avatarUrl?: string | null;
  isPremium: boolean;
  momoPhoneNumber?: string | null;
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd: Date;
    createdAt: Date;
    momoTransactionId?: string | null;
  } | null;
}

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const AdminDashboard = () => {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">(
    "30d",
  );
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  const { data, error, isLoading, refetch } = useQuery<AdminStats>({
    queryKey: ["admin-stats", dateRange],
    queryFn: async () => {
      const response = await kyInstance
        .get(`/api/admin/stats?range=${dateRange}`)
        .json<AdminStats>();
      return response;
    },
  });

  const { data: trendingTopics, isLoading: loadingTrends } = useQuery({
    queryKey: ["admin-trending"],
    queryFn: async () => {
      const response = await kyInstance
        .get("/api/admin/stats/trending")
        .json<{ hashtag: string; count: number }[]>();
      return response;
    },
  });

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-blue-600"></div>
      </div>
    );

  if (error)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">
          Failed to load stats. Please try again later.
        </p>
      </div>
    );

  const formattedUserGrowth =
    data?.growthData?.map((item) => ({
      ...item,
      month: item.month.replace("-", "/"),
    })) || [];

  return (
    <main className="flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">📊 Admin Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last Updated: {new Date().toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          title="Revenue"
          value={data?.totalRevenue ?? 0}
          icon={<FiBarChart2 className="text-purple-500" />}
        />
        <StatCard
          title="Users"
          value={data?.totalUsers ?? 0}
          trend={data?.trends?.users}
          icon={<FiUsers className="text-blue-500" />}
        />
        <StatCard
          title="Posts"
          value={data?.totalPosts ?? 0}
          trend={data?.trends?.posts}
          icon={<FiFileText className="text-green-500" />}
        />
        <StatCard
          title="Reports"
          value={data?.reportedPosts ?? 0}
          trend={data?.trends?.reported}
          icon={<FiAlertCircle className="text-red-500" />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow md:col-span-2">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-lg font-semibold">User Growth</h2>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => {
                  const value = e.target.value as "7d" | "30d" | "90d" | "all";
                  setDateRange(value);
                  refetch();
                }}
                className="rounded-md border px-3 py-1 text-sm shadow-sm"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>

              <button
                onClick={() =>
                  setChartType(chartType === "bar" ? "line" : "bar")
                }
                className="flex items-center gap-1 rounded-md border px-3 py-1 text-sm shadow-sm hover:bg-gray-100"
              >
                {chartType === "bar" ? <FiPieChart /> : <FiBarChart2 />}
                {chartType === "bar" ? "Line View" : "Bar View"}
              </button>

              <div className="relative">
                <div className="group relative inline-block focus-within:outline-none">
                  <button className="flex items-center gap-1 rounded-md bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 focus:outline-none">
                    <FiDownload /> Export
                  </button>

                  <div className="invisible absolute z-10 mt-1 min-w-[120px] rounded-md bg-white opacity-0 shadow transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <button
                      onClick={() =>
                        generatePdfReport(
                          data?.growthData || [],
                          {
                            totalUsers: data?.totalUsers ?? 0,
                            totalPosts: data?.totalPosts ?? 0,
                            reportedPosts: data?.reportedPosts ?? 0,
                            totalRevenue: data?.totalRevenue ?? 0,
                            activeSubscriptions: data?.activeSubscriptions ?? 0,
                            bannedUsers: data?.bannedUsers ?? 0,
                          },
                          trendingTopics || [],
                        )
                      }
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() =>
                        generateExcelReport(
                          data?.growthData || [],
                          {
                            totalUsers: data?.totalUsers ?? 0,
                            totalPosts: data?.totalPosts ?? 0,
                            reportedPosts: data?.reportedPosts ?? 0,
                            totalRevenue: data?.totalRevenue ?? 0,
                            activeSubscriptions: data?.activeSubscriptions ?? 0,
                            bannedUsers: data?.bannedUsers ?? 0,
                          },
                          trendingTopics || [],
                        )
                      }
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={formattedUserGrowth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => value.toLocaleString()} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="users"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="New Users"
                  />
                  <Bar
                    dataKey="posts"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name="New Posts"
                  />
                  <Bar
                    dataKey="reports"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    name="New Reports"
                  />
                </BarChart>
              ) : (
                <LineChart data={formattedUserGrowth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => value.toLocaleString()} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="New Users"
                  />
                  <Line
                    type="monotone"
                    dataKey="posts"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="New Posts"
                  />
                  <Line
                    type="monotone"
                    dataKey="reports"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="New Reports"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 flex items-center gap-1 text-sm font-semibold">
            <FiTrendingUp className="text-orange-500" />
            Trending Topics
          </h2>
          {loadingTrends ? (
            <p className="text-xs text-gray-500">Loading...</p>
          ) : trendingTopics?.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={trendingTopics}
                  dataKey="count"
                  nameKey="hashtag"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name }) => name}
                >
                  {trendingTopics.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-gray-500">No trending topics.</p>
          )}
        </div>
      </div>
    </main>
  );
};

const StatCard = ({
  title,
  value,
  trend,
  icon,
}: {
  title: string;
  value: number;
  trend?: number;
  icon: React.ReactNode;
}) => (
  <div className="rounded-lg bg-white p-6 shadow transition-transform hover:scale-[1.02]">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      {trend !== undefined && (
        <span
          className={`flex items-center text-sm ${trend >= 0 ? "text-green-500" : "text-red-500"}`}
        >
          {trend >= 0 ? (
            <FiTrendingUp className="mr-1" />
          ) : (
            <FiTrendingDown className="mr-1" />
          )}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="mt-2 flex items-center">
      <div className="mr-3">{icon}</div>
      <p className="text-3xl font-bold">
        {title === "Revenue"
          ? `${value.toLocaleString("vi-VN")} ₫`
          : value.toLocaleString()}
      </p>
    </div>
  </div>
);

export default AdminDashboard;
