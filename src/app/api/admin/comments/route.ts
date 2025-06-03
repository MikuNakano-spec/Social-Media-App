import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 5;
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;
    const shouldExport = searchParams.get("export") === "true";

    if (shouldExport) {
      const comments = await prisma.comment.findMany({
        where: {
          content: { contains: search, mode: "insensitive" }
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: { select: { username: true } },
          post: { select: { id: true, content: true } }
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        comments: comments.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
        })),
        total: comments.length,
        currentUserRole: user.role,
      });
    }

    const comments = await prisma.comment.findMany({
      where: {
        content: { contains: search, mode: "insensitive" }
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { username: true } },
        post: { select: { id: true, content: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const totalComments = await prisma.comment.count({
      where: { content: { contains: search, mode: "insensitive" } }
    });

    return NextResponse.json({
      comments: comments.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
      total: totalComments,
      currentUserRole: user.role,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
