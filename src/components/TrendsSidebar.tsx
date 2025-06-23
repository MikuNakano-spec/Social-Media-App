import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import FollowButton from "./FollowButton";
import UserAvatar from "./UserAvatar";
import UserTooltip from "./UserTooltip";
import { getServerTranslation } from "@/lib/i18n/getServerTranslation";

export default function TrendsSidebar() {
  return (
    <div className="sticky top-[5.25rem] hidden h-fit w-72 flex-none space-y-5 md:block lg:w-80">
      <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
        <WhoToFollow />
        <TrendingTopics />
      </Suspense>
    </div>
  );
}

async function WhoToFollow() {
  const { user: currentUser } = await validateRequest();

  const t = getServerTranslation();

  if (!currentUser) return null;

  const currentUserFriends = await prisma.follow.findMany({
    where: { followerId: currentUser.id },
    select: { followingId: true }
  });
  const friendIds = currentUserFriends.map(f => f.followingId);

  const usersToFollow = await prisma.user.findMany({
    where: {
      role: "USER",
      NOT: { id: currentUser.id },
      followers: { none: { followerId: currentUser.id } }
    },
    select: {
      ...getUserDataSelect(currentUser.id),
      followers: { select: { followerId: true } }
    },
    take: 100
  });

  const usersWithMutuals = usersToFollow.map(user => {
    const mutualCount = user.followers.filter(f => 
      friendIds.includes(f.followerId)
    ).length;
    
    return {
      ...user,
      mutualCount,
      followers: user.followers.filter(f => f.followerId === currentUser.id)
    };
  });

  const sortedUsers = [...usersWithMutuals]
    .sort((a, b) => b.mutualCount - a.mutualCount)
    .slice(0, 5);

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">{t.whoyoumightknow}</div>
      {sortedUsers.map((user) => (
        <div key={user.id} className="flex items-center justify-between gap-3">
          <UserTooltip user={user}>
            <Link
              href={`/users/${user.username}`}
              className="flex items-center gap-3"
            >
              <UserAvatar avatarUrl={user.avatarUrl} className="flex-none" />
              <div>
                <p className="line-clamp-1 break-all font-semibold hover:underline">
                  {user.displayName}
                </p>
                <p className="line-clamp-1 break-all text-muted-foreground">
                  @{user.username}
                </p>
                {user.mutualCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {user.mutualCount} mutual friend{user.mutualCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </Link>
          </UserTooltip>
          <FollowButton
            userId={user.id}
            initialState={{
              followers: user._count.followers,
              isFollowedByUser: user.followers.some(
                ({ followerId }) => followerId === currentUser.id,
              ),
            }}
          />
        </div>
      ))}
    </div>
  );
}

const getTrendingTopics = unstable_cache(
  async () => {
    const result = await prisma.$queryRaw<{ hashtag: string; count: bigint }[]>`
            SELECT LOWER(unnest(regexp_matches(content, '#[[:alnum:]_]+', 'g'))) AS hashtag, COUNT(*) AS count
            FROM posts
            GROUP BY (hashtag)
            ORDER BY count DESC, hashtag ASC
            LIMIT 5
        `;

    return result.map((row) => ({
      hashtag: row.hashtag,
      count: Number(row.count),
    }));
  },
  ["trending_topics"],
  {
    revalidate: 3 * 60 * 60,
  },
);

async function TrendingTopics() {
  const trendingTopics = await getTrendingTopics();

  const t = getServerTranslation();

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">{t.trendingtopic}</div>
      {trendingTopics.map(({ hashtag, count }) => {
        const title = hashtag.split("#")[1];

        return (
          <Link key={title} href={`/hashtag/${title}`} className="block">
            <p
              className="line-clamp-1 break-all font-semibold hover:underline"
              title={hashtag}
            >
              {hashtag}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatNumber(count)} {count === 1 ? "post" : "posts"}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
