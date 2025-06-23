import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { user } = await validateRequest();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const search = req.nextUrl.searchParams.get("q") || "";

  const users = await prisma.user.findMany({
    where: {
      id: { not: user.id },
      role: "USER",
      OR: [
        { displayName: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ],
    },
    take: 15,
    select: {
      id: true,
      displayName: true,
      username: true,
      avatarUrl: true,
    },
  });

  return NextResponse.json({ users });
}
