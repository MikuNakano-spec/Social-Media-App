import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";
import { sendPremiumSuccessEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const { user } = await validateRequest();

  if (!user) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure`);
  }

  const url = new URL(req.url);
  const resultCode = url.searchParams.get("resultCode");
  const transId = url.searchParams.get("transId");
  const plan = url.searchParams.get("plan");

  if (resultCode === "0") {
    const now = new Date();
    const currentPeriodEnd =
      plan === "YEARLY"
        ? new Date(now.setFullYear(now.getFullYear() + 1))
        : new Date(now.setMonth(now.getMonth() + 1));

    await prisma.subscription.upsert({
      where: {
        userId: user.id,
      },
      update: {
        plan: plan === "YEARLY" ? "YEARLY" : "MONTHLY",
        status: "ACTIVE",
        momoTransactionId: transId || undefined,
        currentPeriodEnd,
      },
      create: {
        userId: user.id,
        plan: plan === "YEARLY" ? "YEARLY" : "MONTHLY",
        status: "ACTIVE",
        momoTransactionId: transId || undefined,
        currentPeriodEnd,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { isPremium: true },
    });

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (userData?.email) {
      await sendPremiumSuccessEmail({
        email: userData.email,
        name: userData.displayName || "User",
        plan: plan === "YEARLY" ? "YEARLY" : "MONTHLY",
      });
    } else {
      console.error("User email is missing — cannot send confirmation email.");
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/users/subscribe/success`);
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/users/subscribe/failure`);
}
