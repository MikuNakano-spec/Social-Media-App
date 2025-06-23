"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import { createPostSchema } from "@/lib/validation";

export async function submitPost(input: {
  content: string;
  mediaIds: string[];
  visibility: "PUBLIC" | "PRIVATE";
}) {
  const { user } = await validateRequest();
  if (!user) throw new Error("Unauthorized");

  const { content, mediaIds, visibility } = createPostSchema.parse(input);

  return await prisma.$transaction(async (tx) => {
    const newPost = await tx.post.create({
      data: {
        content,
        visibility,
        userId: user.id,
        attachments: {
          connect: mediaIds.map((id) => ({ id })),
        },
      },
      include: getPostDataInclude(user.id),
    });

    const followers = await tx.follow.findMany({
      where: { followingId: user.id },
      select: { followerId: true },
    });

    if (followers.length > 0) {
      await tx.notification.createMany({
        data: followers.map((follower) => ({
          issuerId: user.id,
          recipientId: follower.followerId,
          postId: newPost.id,
          type: "POST_CREATE",
        })),
      });
    }

    return newPost;
  });
}

