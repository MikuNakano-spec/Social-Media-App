import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {

  const result = await prisma.$queryRaw<{ hashtag: string; count: bigint }[]>`
    SELECT LOWER(unnest(regexp_matches(content, '#[[:alnum:]_]+', 'g'))) AS hashtag, COUNT(*) AS count
    FROM posts
    GROUP BY (hashtag)
    ORDER BY count DESC, hashtag ASC
    LIMIT 3
  `;

  const trending = result.map((row) => ({
    hashtag: row.hashtag,
    count: Number(row.count),
  }));

  return NextResponse.json(trending);
}
