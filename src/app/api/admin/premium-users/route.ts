"use server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

const MONTHLY_PRICE = 999000;
const YEARLY_PRICE = 10788000;

export async function GET(req: Request) {
  try {
    const { user } = await validateRequest();
    const allowedRoles = ["ADMIN", "MODERATOR", "SUPER_ADMIN", "GUEST"];

    if (!user || !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const search = searchParams.get("search");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const shouldExport = searchParams.get("export") === "true";

    const where: Prisma.UserWhereInput = {
      isPremium: true,
      OR: search
        ? [
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    };

    // For exports, get all data without pagination
    if (shouldExport) {
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
          subscription: {
            select: {
              plan: true,
              status: true,
              currentPeriodEnd: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        premiumUsers: users,
      });
    }

    // Regular paginated query
    const pageNum = parseInt(page || "1", 10) || 1;
    const limitNum = parseInt(limit || "10", 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      select: { plan: true },
    });

    const mrr = activeSubscriptions.reduce((acc, sub) => {
      return acc + (sub.plan === "MONTHLY" ? MONTHLY_PRICE : YEARLY_PRICE / 12);
    }, 0);

    const activeUsersCount = activeSubscriptions.length;
    const arpu = activeUsersCount > 0 ? mrr / activeUsersCount : 0;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        isBanned: true,
        isPremium: true,
        role: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
            createdAt: true,
            momoTransactionId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNum,
    });

    const totalUsers = await prisma.user.count({ where });

    return NextResponse.json({
      premiumUsers: users,
      total: totalUsers,
      page: pageNum,
      limit: limitNum,
      mrr,
      arpu,
    });
  } catch (error) {
    console.error("Error fetching premium users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}