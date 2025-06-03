import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await validateRequest();
    if (!user || !["ADMIN", "MODERATOR", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await req.json();
    const comment = await prisma.comment.update({
      where: { id: params.id },
      data: { content },
      select: { id: true, content: true },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await validateRequest();
    if (!user || !["ADMIN", "MODERATOR", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.comment.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
