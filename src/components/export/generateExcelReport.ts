import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface GrowthEntry {
  month: string;
  users: number;
  posts: number;
  reports: number;
}

interface Stats {
  totalUsers: number;
  totalPosts: number;
  reportedPosts: number;
  totalRevenue: number;
  activeSubscriptions: number;
  bannedUsers: number;
}

interface TrendingTopic {
  hashtag: string;
  count: number;
}

export function generateExcelReport(
  growthData: GrowthEntry[],
  stats: Stats,
  trendingTopics: TrendingTopic[]
) {
  const workbook = XLSX.utils.book_new();

  const overviewData = [
    [
      "Total Users",
      "Total Posts",
      "Reported Posts",
      "Total Revenue (VND)",
      "Active Subscriptions",
      "Banned Users",
    ],
    [
      stats.totalUsers,
      stats.totalPosts,
      stats.reportedPosts,
      stats.totalRevenue,
      stats.activeSubscriptions,
      stats.bannedUsers,
    ],
  ];
  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, "Overview");

  const growthSheetData = [
    ["Month", "New Users", "New Posts", "New Reports"],
    ...growthData.map((entry) => [
      entry.month,
      entry.users,
      entry.posts,
      entry.reports,
    ]),
  ];
  const growthSheet = XLSX.utils.aoa_to_sheet(growthSheetData);
  XLSX.utils.book_append_sheet(workbook, growthSheet, "Growth Data");

  const trendingSheetData = [
    ["Hashtag", "Mentions"],
    ...trendingTopics.map((topic) => [topic.hashtag, topic.count]),
  ];
  const trendingSheet = XLSX.utils.aoa_to_sheet(trendingSheetData);
  XLSX.utils.book_append_sheet(workbook, trendingSheet, "Trending Topics");

  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  saveAs(blob, "admin_report.xlsx");
}
