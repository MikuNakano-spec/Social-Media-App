"use server";

import { hash, verify } from "@node-rs/argon2";
import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";
import { sendPasswordChangeVerificationEmail } from "@/lib/email";

export async function initiatePasswordChange({
  userId,
  currentPassword,
  newPassword,
}: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, email: true, username: true }
    });

    if (!user?.passwordHash) {
      return { error: "Password change not available for this account" };
    }

    const validPassword = await verify(user.passwordHash, currentPassword);
    if (!validPassword) {
      return { error: "Current password is incorrect" };
    }

    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const newPasswordHash = await hash(newPassword, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        resetPasswordToken: `${codeHash}:${newPasswordHash}`,
        resetPasswordExpire: expiresAt
      }
    });

    if (user.email) {
      await sendPasswordChangeVerificationEmail({
        email: user.email,
        code,
        name: user.username || "User"
      });
    }

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to initiate password change" };
  }
}

export async function verifyPasswordChangeCode({
  userId,
  code,
}: {
  userId: string;
  code: string;
}) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { resetPasswordToken: true, resetPasswordExpire: true }
    });

    if (!user?.resetPasswordToken || !user.resetPasswordExpire) {
      return { error: "No pending password change" };
    }

    if (new Date() > user.resetPasswordExpire) {
      return { error: "Code expired" };
    }

    const [storedCodeHash, newPasswordHash] = user.resetPasswordToken.split(':');
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");

    if (codeHash !== storedCodeHash) {
      return { error: "Invalid code" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        resetPasswordToken: null,
        resetPasswordExpire: null
      }
    });

    await lucia.invalidateUserSessions(userId);
    
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to verify code" };
  }
}