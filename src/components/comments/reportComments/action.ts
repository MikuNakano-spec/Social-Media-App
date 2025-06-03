"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function reportComment(commentId: string) {
  const { user } = await validateRequest();
  if (!user) throw new Error("Unauthorized");

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Comment not found");

  const existingReport = await prisma.report.findFirst({
    where: {
      userId: user.id,
      commentId: commentId, 
    },
  });

  if (existingReport) {
    throw new Error("You have already reported this comment.");
  }

  const report = await prisma.report.create({
    data: {
      commentId,
      userId: user.id,
      postId: comment.postId,
      status: "PENDING",
    },
  });

  return report;
}
