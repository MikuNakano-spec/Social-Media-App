"use server";

import { lucia } from "@/auth";
import { checkMemoryRateLimit } from "@/lib/memoryRateLimiter";
import prisma from "@/lib/prisma";
import { loginSchema, LoginValues } from "@/lib/validation";
import { verify } from "@node-rs/argon2";
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export async function login(
  credentials: LoginValues,
): Promise<{ error: string; rateLimit?: { remaining: number; reset: number } }> {
  try {
    const { username, password } = loginSchema.parse(credentials);

    const ip = headers().get("x-forwarded-for") || "unknown";
    const rateLimitKey = `login:${ip}`;

    const rateLimit = checkMemoryRateLimit(
      rateLimitKey,
      15 * 60 * 1000, 
      5 
    );

    if (!rateLimit.isAllowed) {
      return {
        error: "Too many login attempts. Please try again later.",
        rateLimit: {
          remaining: rateLimit.remaining,
          reset: rateLimit.reset
        }
      };
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    if (!existingUser || !existingUser.passwordHash) {
      return {
        error: "Incorrect username or password",
      };
    }

    if (existingUser.isBanned) {
      return { error: "Your account has been banned. Please contact support." };
    }

    const validPassword = await verify(existingUser.passwordHash, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    if (!validPassword) {
      return {
        error: "Incorrect username or password",
      };
    }

    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    if (existingUser.role === "ADMIN" || existingUser.role === "SUPER_ADMIN" || existingUser.role === "MODERATOR" || existingUser.role === "GUEST"){
      return redirect("/admin");
    }

    return redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);
    return {
      error: "Something went wrong. Please try again.",
    };
  }
}
