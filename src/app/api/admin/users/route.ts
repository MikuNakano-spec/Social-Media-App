"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const { user: currentUser } = await validateRequest();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 5;
    const exportData = searchParams.get("export") === "true";

    if (exportData) {
      const users = await prisma.user.findMany({
        where: { username: { contains: search, mode: "insensitive" } },
        include: { subscription: true },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        users: users.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
          subscription: user.subscription
            ? {
                ...user.subscription,
                currentPeriodEnd:
                  user.subscription.currentPeriodEnd.toISOString(),
                createdAt: user.subscription.createdAt.toISOString(),
                updatedAt: user.subscription.updatedAt.toISOString(),
              }
            : null,
        })),
      });
    }

    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      where: { username: { contains: search, mode: "insensitive" } },
      select: { id: true, username: true, role: true, isBanned: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const totalUsers = await prisma.user.count({
      where: { username: { contains: search, mode: "insensitive" } },
    });

    return NextResponse.json({
      users,
      totalUsers,
      currentUserId: currentUser.id,
      currentUserRole: currentUser.role,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { user: currentUser } = await validateRequest();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.action === "create-user") {
      if (currentUser.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { username, email, password, role } = body;

      if (!username || !password || !role) {
        return NextResponse.json(
          { error: "Username, password, and role are required" },
          { status: 400 },
        );
      }

      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ username }, { email: email || undefined }] },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Username or email already exists" },
          { status: 409 },
        );
      }

      const salt = crypto.randomBytes(16).toString("hex");
      const hash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, "sha512")
        .toString("hex");

      const newUser = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          username,
          email: email || null,
          passwordHash: `${salt}$${hash}`,
          role,
          displayName: username,
          isBanned: false,
          isPremium: false,
          googleId: null,
          bio: null,
          avatarUrl: null,
          momoPhoneNumber: null,
        },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
        },
      });
    }

    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const userToBan = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!userToBan) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const roleHierarchy = {
      SUPER_ADMIN: 4,
      ADMIN: 3,
      MODERATOR: 2,
      GUEST: 1,
      USER: 0,
    };

    const currentUserLevel =
      roleHierarchy[currentUser.role as keyof typeof roleHierarchy] || 0;
    const targetUserLevel =
      roleHierarchy[userToBan.role as keyof typeof roleHierarchy] || 0;

    if (currentUserLevel <= targetUserLevel) {
      return NextResponse.json(
        { error: "Insufficient permissions to ban this user" },
        { status: 403 },
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: true },
    });

    return NextResponse.json({ message: "User banned successfully" });
  } catch (error) {
    console.error("Error in POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { user: currentUser } = await validateRequest();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const userToUnban = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!userToUnban) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const roleHierarchy = {
      SUPER_ADMIN: 4,
      ADMIN: 3,
      MODERATOR: 2,
      GUEST: 1,
      USER: 0,
    };

    const currentUserLevel =
      roleHierarchy[currentUser.role as keyof typeof roleHierarchy] || 0;
    const targetUserLevel =
      roleHierarchy[userToUnban.role as keyof typeof roleHierarchy] || 0;

    if (currentUserLevel <= targetUserLevel) {
      return NextResponse.json(
        { error: "Insufficient permissions to unban this user" },
        { status: 403 },
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: false },
    });

    return NextResponse.json({ message: "User unbanned successfully" });
  } catch (error) {
    console.error("Error unbanning user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { user: currentUser } = await validateRequest();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();

    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot delete yourself" },
        { status: 403 },
      );
    }

    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions to delete users" },
        { status: 403 },
      );
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const roleHierarchy = {
      SUPER_ADMIN: 4,
      ADMIN: 3,
      MODERATOR: 2,
      GUEST: 1,
      USER: 0,
    };

    const currentUserLevel =
      roleHierarchy[currentUser.role as keyof typeof roleHierarchy] || 0;
    const targetUserLevel =
      roleHierarchy[userToDelete.role as keyof typeof roleHierarchy] || 0;

    if (userToDelete.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Super Admin accounts cannot be deleted" },
        { status: 403 },
      );
    }

    if (currentUserLevel <= targetUserLevel) {
      return NextResponse.json(
        {
          error: `Your ${currentUser.role.toLowerCase()} role cannot delete ${userToDelete.role.toLowerCase()} accounts`,
        },
        { status: 403 },
      );
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({
      success: true,
      message: `User deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      {
        error: "Failed to delete user",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, newRole, newUsername } = await req.json();
    const { user: adminUser } = await validateRequest();

    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userId === adminUser.id) {
      return NextResponse.json(
        { error: "You cannot modify yourself" },
        { status: 403 },
      );
    }

    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const roleHierarchy = {
      SUPER_ADMIN: 4,
      ADMIN: 3,
      MODERATOR: 2,
      GUEST: 1,
      USER: 0,
    };

    const currentUserLevel =
      roleHierarchy[adminUser.role as keyof typeof roleHierarchy] || 0;
    const targetUserLevel =
      roleHierarchy[userToUpdate.role as keyof typeof roleHierarchy] || 0;

    if (userToUpdate.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Cannot modify Super Admin" },
        { status: 403 },
      );
    }

    if (currentUserLevel <= targetUserLevel) {
      return NextResponse.json(
        { error: "Insufficient permission to modify this user" },
        { status: 403 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: newRole ?? userToUpdate.role,
        username: newUsername ?? userToUpdate.username,
      },
    });

    return NextResponse.json({ success: true, updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
