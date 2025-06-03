import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { mediaIds, caption } = await req.json();

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await prisma.story.create({
      data: {
        userId: user.id,
        expiresAt,
        caption,
        media: {
          connect: mediaIds.map((id: string) => ({ id }))
        }
      },
      include: {
        media: true,
        user: true
      }
    });

    return NextResponse.json(story);
  } catch (error) {
    console.error("Error creating story:", error);
    return NextResponse.json(
      { error: "Failed to create story" }, 
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { user } = await validateRequest();

    const stories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: new Date() },
        OR: [
          { user: { followers: { some: { followerId: user?.id || "" } } } },
          { user: { id: user?.id } }
        ]
      },
      include: {
        media: true,
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(stories);
  } catch (error) {
    console.error("Error fetching stories:", error);
    return NextResponse.json([], { status: 500 });
  }
}
