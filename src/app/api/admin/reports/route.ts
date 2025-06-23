"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { user: currentUser } = await validateRequest();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as
      | "PENDING"
      | "REVIEWED"
      | "RESOLVED"
      | null;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 5;
    const includeContent = searchParams.get("includeContent") === "true";
    const shouldExport = searchParams.get("export") === "true";
    const skip = (page - 1) * limit;

    if (shouldExport) {
      const reports = await prisma.report.findMany({
        where: status ? { status } : undefined,
        select: {
          id: true,
          postId: true,
          commentId: true,
          userId: true,
          status: true,
          createdAt: true,
          post: {
            select: { id: true, content: true },
          },
          comment: {
            select: { id: true, content: true },
          },
          user: {
            select: { username: true },
          },
        },
        orderBy: [
          { status: "asc" }, 
          { createdAt: "desc" },
        ],
      });

      const statusPriority = {
        PENDING: 0,
        REVIEWED: 1,
        RESOLVED: 2,
      };

      reports.sort((a, b) => {
        const statusA = statusPriority[a.status as keyof typeof statusPriority] ?? 99;
        const statusB = statusPriority[b.status as keyof typeof statusPriority] ?? 99;
        if (statusA !== statusB) return statusA - statusB;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const transformedReports = reports.map((report) => ({
        id: report.id,
        postId: report.postId,
        commentId: report.commentId,
        postContent: report.post?.content || "",
        commentContent: report.comment?.content || "",
        user: { username: report.user.username },
        status: report.status,
        createdAt: report.createdAt.toISOString(),
      }));

      return NextResponse.json({
        reports: transformedReports,
        total: reports.length,
      });
    }

    const reports = await prisma.report.findMany({
      where: status ? { status } : undefined,
      select: {
        id: true,
        postId: true,
        commentId: true,
        userId: true,
        status: true,
        createdAt: true,
        post: {
          select: { id: true, content: includeContent },
        },
        comment: {
          select: { id: true, content: includeContent },
        },
        user: {
          select: { username: true },
        },
      },
      orderBy: [
        { status: "asc" }, 
        { createdAt: "desc" },
      ],
      skip,
      take: limit,
    });

    const statusPriority = {
      PENDING: 0,
      REVIEWED: 1,
      RESOLVED: 2,
    };

    reports.sort((a, b) => {
      const statusA = statusPriority[a.status as keyof typeof statusPriority] ?? 99;
      const statusB = statusPriority[b.status as keyof typeof statusPriority] ?? 99;
      if (statusA !== statusB) return statusA - statusB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const totalReports = await prisma.report.count({
      where: status ? { status } : undefined,
    });

    const transformedReports = reports.map((report) => ({
      id: report.id,
      postId: report.postId,
      commentId: report.commentId,
      postContent: report.post?.content || "",
      commentContent: report.comment?.content || "",
      user: { username: report.user.username },
      status: report.status,
      createdAt: report.createdAt.toISOString(),
    }));

    return NextResponse.json({
      reports: transformedReports,
      total: totalReports,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json();
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["ADMIN", "MODERATOR", "SUPER_ADMIN"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Requires ADMIN, MODERATOR, or SUPER_ADMIN role" },
        { status: 403 },
      );
    }

    await prisma.report.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating report status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}