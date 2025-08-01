import { validateRequest } from "@/auth";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { Bookmark, Home, Mail, DollarSign, Gamepad } from "lucide-react";
import Link from "next/link";
import NotificationsButton from "./NotificationsButton";
import MessagesButton from "./MessagesButton";
import streamServerClient from "@/lib/stream";
import { getServerTranslation } from "@/lib/i18n/getServerTranslation";

interface MenuBarProps {
  className?: string;
}

export default async function MenuBar({ className }: MenuBarProps) {
  const { user } = await validateRequest();
  if (!user) return null;

  const t = getServerTranslation();

  const [unreadNotificationCount, unreadMessagesCount] = await Promise.all([
    prisma.notification.count({
      where: {
        recipientId: user.id,
        read: false,
      },
    }),
    (await streamServerClient.getUnreadCount(user.id)).total_unread_count,
  ]);

  return (
    <div className={className}>
      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        title="Home"
        asChild
      >
        <Link href="/">
          <Home />
          <span className="hidden lg:inline">{t.home}</span>
        </Link>
      </Button>

      <NotificationsButton
        initialState={{ unreadCount: unreadNotificationCount }}
      />
      <MessagesButton initialState={{ unreadCount: unreadMessagesCount }} />

      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        title="Bookmarks"
        asChild
      >
        <Link href="/bookmarks">
          <Bookmark />
          <span className="hidden lg:inline">{t.bookmarks}</span>
        </Link>
      </Button>

      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        title="Subscribe"
        asChild
      >
        <Link href="/users/subscribe">
          <DollarSign />
          <span className="hidden lg:inline">{t.premium}</span>
        </Link>
      </Button>
      {user.isPremium && (
        <Button
          variant="ghost"
          className="flex items-center justify-start gap-3"
          title="Game"
          asChild
        >
          <Link href="/game">
            <Gamepad />
            <span className="hidden lg:inline">{t.game}</span>
          </Link>
        </Button>
      )}
    </div>
  );
}
