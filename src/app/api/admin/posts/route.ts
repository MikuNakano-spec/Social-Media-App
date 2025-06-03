"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { search, page = 1, limit = 10, export: exportParam } = Object.fromEntries(
      new URL(req.url).searchParams
    );

    if (exportParam === "true") {
      const posts = await prisma.post.findMany({
        where: search ? { 
          content: { contains: search, mode: "insensitive" } 
        } : undefined,
        select: {
          id: true,
          content: true,
          createdAt: true,
          attachments: {
            select: {
              id: true,
              url: true,
              type: true
            }
          },
          user: { select: { username: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(posts);
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const posts = await prisma.post.findMany({
      where: search ? { 
        content: { contains: search, mode: "insensitive" } 
      } : undefined,
      select: {
        id: true,
        content: true,
        createdAt: true,
        attachments: {
          select: {
            id: true,
            url: true,
            type: true
          }
        },
        user: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNum,
    });

    const totalPosts = await prisma.post.count({
      where: search ? { 
        content: { contains: search, mode: "insensitive" } 
      } : undefined,
    });

    return NextResponse.json({ 
      posts, 
      totalPosts, 
      page: pageNum,
      limit: limitNum,
      currentUserRole: user.role 
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user || user.role === "GUEST") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await req.json();

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.post.delete({ where: { id: postId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}