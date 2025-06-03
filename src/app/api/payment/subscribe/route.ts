import { NextResponse } from "next/server";
import { momoClient } from "@/lib/momo";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const { user } = await validateRequest();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan }: { plan: "MONTHLY" | "YEARLY" } = await req.json();
  if (!["MONTHLY", "YEARLY"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
  }

  const userId = user.id;
  const amount = plan === "YEARLY" ? 999000 : 99000;
  const orderId = `ORDER_${userId}_${Date.now()}`;

  try {
    const payment = await momoClient.createPayment({
      amount,
      orderId,
      orderInfo: `Subscription for ${plan}`,
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/users/subscribe/return`,
      ipnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/webhook`,
      extraData: `userId=${userId}&plan=${plan}`,
    });

    await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status: "PENDING",
        momoTransactionId: null,
        currentPeriodEnd: new Date(0),
      },
      create: {
        userId,
        plan,
        status: "PENDING",
        currentPeriodEnd: new Date(0),
      },
    });

    return NextResponse.json({ payUrl: payment.payUrl });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
  }
}
