// src/app/api/media/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user } = await validateRequest();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const media = await prisma.media.findUnique({ where: { id: params.id } });
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const key = media.url.split(`/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`)[1];
  if (!key) return NextResponse.json({ error: "Invalid media key" }, { status: 500 });

  const remoteUrl = `https://uploadthing.com/f/${key}`;
  const fetchRes = await fetch(remoteUrl);

  if (!fetchRes.ok) {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }

  // Copy headers and stream body
  const headers = new Headers(fetchRes.headers);
  headers.set("Cache-Control", "public, max-age=31536000"); // Optional: cache

  return new NextResponse(fetchRes.body, {
    status: 200,
    headers,
  });
}
