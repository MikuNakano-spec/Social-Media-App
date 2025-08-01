import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { Lucia, Session, User } from "lucia";
import { cookies } from "next/headers";
import { cache } from "react";
import prisma from "./lib/prisma";
import { Google } from "arctic";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes(databaseUserAttributes) {
    return {
      id: databaseUserAttributes.id,
      username: databaseUserAttributes.username,
      displayName: databaseUserAttributes.displayName,
      avatarUrl: databaseUserAttributes.avatarUrl,
      googleId: databaseUserAttributes.googleId,
      role: databaseUserAttributes.role,
      isPremium: databaseUserAttributes.isPremium,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  googleId: string | null;
  role: string;
  isPremium: boolean;
}

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/google`
);

export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;

    if (!sessionId) {
      return {
        user: null,
        session: null,
      };
    }

    const result = await lucia.validateSession(sessionId);

    try {
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }
    } catch {}

    if (!result.user) {
      return {
        user: null,
        session: null,
      };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: result.user.id },
      include: {
        subscription: true,
      },
    });

    if (!dbUser) {
      return {
        user: null,
        session: null,
      };
    }

    const sub = dbUser.subscription;
    if (dbUser.isPremium && (!sub || sub.currentPeriodEnd < new Date())) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { isPremium: false },
      });
      dbUser.isPremium = false;
    }

    return {
      user: {
        ...result.user,
        isPremium: dbUser.isPremium,
      } as User,
      session: result.session,
    };
  }
);
