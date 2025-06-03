import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPremiumSuccessEmail } from "@/lib/email";

export async function POST(req: Request) {
  const data = await req.json();
  const { resultCode, orderId, transId, extraData } = data;

  if (resultCode === 0) {
    const [_, userId] = orderId.split("_");
    const plan = new URLSearchParams(extraData).get("plan") as
      | "MONTHLY"
      | "YEARLY";

    if (!userId || !plan) {
      return NextResponse.json(
        { error: "Invalid webhook data" },
        { status: 400 },
      );
    }

    const now = new Date();
    const currentPeriodEnd = new Date(now);
    currentPeriodEnd.setMonth(now.getMonth() + (plan === "MONTHLY" ? 1 : 12));

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isPremium: true },
    });

    if (!user.email) {
      console.error("User email is missing — cannot send confirmation email.");
    } else {
      await sendPremiumSuccessEmail({
        email: user.email,
        name: user.displayName,
        plan: plan || "Unknown Plan",
      });
    }

    try {
      await prisma.subscription.update({
        where: { userId },
        data: {
          status: "ACTIVE",
          momoTransactionId: transId.toString(),
          plan,
          currentPeriodEnd,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { isPremium: true },
      });

      return NextResponse.json({ message: "Subscription activated" });
    } catch (error) {
      console.error("Webhook processing error:", error);
      return NextResponse.json(
        { error: "Failed to update subscription" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ message: "Payment failed or canceled" });
}
