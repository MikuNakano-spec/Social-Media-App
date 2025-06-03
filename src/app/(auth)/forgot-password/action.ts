"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { hash } from "@node-rs/argon2";
import { generateId } from "lucia";
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { sendResetEmail } from "@/lib/email";

export async function forgotPassword(email: string) {
  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true, email: true, username: true }
    });

    if (!user) {
      return { error: "No user found with this email" };
    }

    if (!user.email) {
      return { error: "This account has no email associated" };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpire: resetTokenExpiry,
      },
    });

    await sendResetEmail({
      email: user.email,
      name: user.username || "User",
      resetToken,
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to send reset email" };
  }
}

export async function resetPassword(token: string, password: string) {
  try {
    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpire: { gt: new Date() },
      },
    });

    if (!user) {
      return { error: "Invalid or expired token" };
    }

    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpire: null,
      },
    });

    await lucia.invalidateUserSessions(user.id);
    
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);
    return { error: "Failed to reset password" };
  }
}