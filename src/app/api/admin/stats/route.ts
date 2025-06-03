"use server";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { subDays, subMonths } from "date-fns";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") as
      | "7d"
      | "30d"
      | "90d"
      | "all"
      | null;

    const now = new Date();
    let startDate: Date | undefined;

    if (range === "7d") startDate = subDays(now, 7);
    else if (range === "30d") startDate = subDays(now, 30);
    else if (range === "90d") startDate = subMonths(now, 3);

    const totalUsers = await prisma.user.count({
      where: startDate ? { createdAt: { gte: startDate } } : undefined,
    });

    const totalPosts = await prisma.post.count({
      where: startDate ? { createdAt: { gte: startDate } } : undefined,
    });

    const reportedPosts = await prisma.report.count({
      where: startDate ? { createdAt: { gte: startDate } } : undefined,
    });

    const totalSubscriptions = await prisma.subscription.count({
      where: startDate ? { createdAt: { gte: startDate } } : undefined,
    });
    const FIXED_SUBSCRIPTION_PRICE = 999000;
    const totalRevenue = totalSubscriptions * FIXED_SUBSCRIPTION_PRICE;

    const [userGrowth, postGrowth, reportGrowth] = await Promise.all([
      prisma.$queryRaw<{ month: string; count: number }[]>`
        SELECT TO_CHAR("createdAt", 'MM-YYYY') AS month, COUNT(*)::int AS count
        FROM "users"
        ${startDate ? Prisma.sql`WHERE "createdAt" >= ${startDate}` : Prisma.empty}
        GROUP BY month
        ORDER BY MIN("createdAt");
      `,
      prisma.$queryRaw<{ month: string; count: number }[]>`
        SELECT TO_CHAR("createdAt", 'MM-YYYY') AS month, COUNT(*)::int AS count
        FROM "posts"
        ${startDate ? Prisma.sql`WHERE "createdAt" >= ${startDate}` : Prisma.empty}
        GROUP BY month
        ORDER BY MIN("createdAt");
      `,
      prisma.$queryRaw<{ month: string; count: number }[]>`
        SELECT TO_CHAR("createdAt", 'MM-YYYY') AS month, COUNT(*)::int AS count
        FROM "reports"
        ${startDate ? Prisma.sql`WHERE "createdAt" >= ${startDate}` : Prisma.empty}
        GROUP BY month
        ORDER BY MIN("createdAt");
      `,
    ]);

    const allMonths = Array.from(
      new Set([
        ...userGrowth.map((u) => u.month),
        ...postGrowth.map((p) => p.month),
        ...reportGrowth.map((r) => r.month),
      ]),
    ).sort();

    const combinedGrowth = allMonths.map((month) => ({
      month: month.replace("-", "/"),
      users: userGrowth.find((u) => u.month === month)?.count || 0,
      posts: postGrowth.find((p) => p.month === month)?.count || 0,
      reports: reportGrowth.find((r) => r.month === month)?.count || 0,
    }));

    const previousRange =
      range === "7d"
        ? subDays(now, 14)
        : range === "30d"
          ? subDays(now, 60)
          : range === "90d"
            ? subMonths(now, 6)
            : null;

    const previousUsers = previousRange
      ? await prisma.user.count({
          where: { createdAt: { gte: previousRange, lt: startDate } },
        })
      : 0;

    const trends = {
      users: calculateTrend(totalUsers, previousUsers),
      posts: 0,
      reported: 0,
    };

    const activeSubscriptions = await prisma.subscription.count({
      where: {
        status: "ACTIVE",
        ...(startDate && { createdAt: { gte: startDate } }),
      },
    });

    const bannedUsers = await prisma.user.count({
      where: {
        isBanned: true,
        ...(startDate && { createdAt: { gte: startDate } }),
      },
    });

    return NextResponse.json({
      totalUsers,
      totalPosts,
      reportedPosts,
      totalRevenue,
      activeSubscriptions,
      bannedUsers,
      growthData: combinedGrowth,
      trends,
    });
  } catch (error: any) {
    console.error("Error fetching admin stats:", error.message);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
