// src/app/api/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

export async function POST(req: NextRequest) {
  const { user } = await validateRequest();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { url, channelId } = await req.json();
  
  // Append channel ID to URL as parameter
  const mediaUrl = `${url}?channelId=${channelId}`;
  
  const media = await prisma.media.create({
    data: {
      url: mediaUrl,
      type: "IMAGE" // Required by your schema
    }
  });

  return NextResponse.json({ id: media.id });
}