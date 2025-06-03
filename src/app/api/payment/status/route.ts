import { validateRequest } from "@/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const { user } = await validateRequest();
  if (!user) return NextResponse.json({ user: null });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isPremium: true },
  });

  return NextResponse.json({ user: { isPremium: dbUser?.isPremium ?? false } });
}
