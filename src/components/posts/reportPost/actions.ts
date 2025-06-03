"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function reportPost(id: string) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) throw new Error("Post not found");

  const existingReport = await prisma.report.findFirst({
    where: {
      userId: user.id,
      postId: id,
    },
  });

  if (existingReport) {
    throw new Error("You have already reported this post.");
  }

  const report = await prisma.report.create({
    data: {
      postId: id,
      userId: user.id,
      status: "PENDING",
    },
  });

  return report;
}
