"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import kyInstance from "@/lib/ky";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  MoreVertical,
  ShieldCheck,
  UserX,
  Trash2,
  Pencil,
  Ban,
  Undo,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  generateUsersExcelReport,
  generateUsersPdfReport,
} from "@/components/export/generateUserReports";
import { FiDownload } from "react-icons/fi";

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  role: string;
  isBanned: boolean;
  createdAt: string;
}

interface AdminUsersResponse {
  users: User[];
  totalUsers: number;
  currentUserId: string;
  currentUserRole: string;
}

interface ExportUsersResponse {
  users: {
    id: string;
    username: string;
    displayName: string;
    email: string | null;
    role: string;
    isBanned: boolean;
    createdAt: string;
    subscription?: {
      plan: string;
      status: string;
      currentPeriodEnd: string;
    } | null;
  }[];
}

enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR",
  GUEST = "GUEST",
  USER = "USER",
}

enum UserStatus {
  BANNED = "BANNED",
  ACTIVE = "ACTIVE",
}

const roleOrder: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.MODERATOR]: 3,
  [UserRole.GUEST]: 4,
  [UserRole.USER]: 5,
};

const roleHierarchy: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 4,
  [UserRole.ADMIN]: 3,
  [UserRole.MODERATOR]: 2,
  [UserRole.GUEST]: 1,
  [UserRole.USER]: 0,
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [editUsernameId, setEditUsernameId] = useState<string | null>(null);
  const [editedUsername, setEditedUsername] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>(UserRole.USER);
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);

  const usersPerPage = 5;

  const { data, error, isLoading } = useQuery<AdminUsersResponse>({
    queryKey: ["admin-users", searchTerm, page],
    queryFn: async () =>
      kyInstance
        .get(
          `/api/admin/users?search=${searchTerm}&page=${page}&limit=${usersPerPage}`,
        )
        .json(),
  });

  const handleExportUsers = async (type: "excel" | "pdf") => {
    try {
      setIsExporting(type);
      const data = await kyInstance
        .get(`/api/admin/users?search=${searchTerm}&export=true`)
        .json<ExportUsersResponse>();

      if (type === "excel") {
        generateUsersExcelReport(data.users);
      } else {
        generateUsersPdfReport(data.users);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(null);
    }
  };

  const users = data?.users ?? [];
  const totalUsers = data?.totalUsers ?? 0;
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const currentUserId = data?.currentUserId;
  const currentUserRole = data?.currentUserRole;

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };

  const setRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      newRole,
    }: {
      userId: string;
      newRole: UserRole;
    }) => {
      await kyInstance.patch("/api/admin/users", {
        json: { userId, newRole },
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await kyInstance.delete("/api/admin/users", { json: { userId: id } });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const editUsernameMutation = useMutation({
    mutationFn: async ({
      userId,
      newUsername,
    }: {
      userId: string;
      newUsername: string;
    }) => {
      await kyInstance.patch("/api/admin/users", {
        json: { userId, newUsername },
      });
    },
    onSuccess: () => {
      setEditUsernameId(null);
      setEditedUsername("");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const banMutation = useMutation({
    mutationFn: async (userId: string) => {
      await kyInstance.post("/api/admin/users", { json: { userId } });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      await kyInstance.put("/api/admin/users", { json: { userId } });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      await kyInstance.post("/api/admin/users", {
        json: {
          action: "create-user",
          username: newUsername,
          email: newEmail,
          password: newPassword,
          role: newRole,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsCreatingUser(false);
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setNewRole(UserRole.USER);
    },
  });

  if (isLoading) return <div className="p-6 text-center">Loading users...</div>;
  if (error)
    return (
      <div className="p-6 text-center text-red-500">Failed to load users</div>
    );

  return (
    <TooltipProvider>
      <div className="bg-white p-6 shadow-lg">
        <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-800"></h1>
          <div className="flex w-full gap-2 sm:w-auto">
            <Input
              type="text"
              placeholder="Search users..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onBlur={handleSearch}
              className="max-w-md flex-1"
            />
            <Button onClick={handleSearch} variant="outline" className="gap-2">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting !== null}>
                  {isExporting ? (
                    <span className="flex items-center">
                      Exporting {isExporting === "excel" ? "Excel" : "PDF"}...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <FiDownload className="h-4 w-4" />
                      Export Users
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExportUsers("excel")}>
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportUsers("pdf")}>
                  Export to PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {currentUserRole === UserRole.SUPER_ADMIN && (
              <Dialog open={isCreatingUser} onOpenChange={setIsCreatingUser}>
                <DialogTrigger asChild>
                  <Button
                    variant="default"
                    className="bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Create New User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">
                        Role
                      </Label>
                      <select
                        value={newRole}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setNewRole(e.target.value as UserRole)
                        }
                        className="col-span-3 rounded-md border p-2 focus:ring-2 focus:ring-primary"
                      >
                        {Object.values(UserRole)
                          .filter((role) => role !== UserRole.SUPER_ADMIN)
                          .map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreatingUser(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => createUserMutation.mutate()}
                        disabled={createUserMutation.isPending}
                        className="bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {createUserMutation.isPending
                          ? "Creating..."
                          : "Create User"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">
                  Username
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">
                  Role
                </th>
                <th className="p-3 text-center text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[...users]
                .sort((a, b) => {
                  const roleOrderA = roleOrder[a.role as UserRole] ?? 99;
                  const roleOrderB = roleOrder[b.role as UserRole] ?? 99;
                  if (roleOrderA !== roleOrderB) {
                    return roleOrderA - roleOrderB;
                  }
                  return (
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                  );
                })
                .map((user) => {
                  const canModify =
                    currentUserRole &&
                    roleHierarchy[currentUserRole as UserRole] >
                      roleHierarchy[user.role as UserRole] &&
                    user.role !== UserRole.SUPER_ADMIN &&
                    user.id !== currentUserId &&
                    currentUserRole !== UserRole.GUEST;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        {editUsernameId === user.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editedUsername}
                              onChange={(e) =>
                                setEditedUsername(e.target.value)
                              }
                              className="w-40"
                            />
                            <Button
                              size="sm"
                              onClick={() =>
                                editUsernameMutation.mutate({
                                  userId: user.id,
                                  newUsername: editedUsername,
                                })
                              }
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditUsernameId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {user.username}
                            {canModify && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditUsernameId(user.id);
                                      setEditedUsername(user.username);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit username</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                            user.isBanned
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.isBanned
                            ? UserStatus.BANNED
                            : UserStatus.ACTIVE}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                            user.role === UserRole.SUPER_ADMIN
                              ? "bg-purple-100 text-purple-800"
                              : user.role === UserRole.ADMIN
                                ? "bg-blue-100 text-blue-800"
                                : user.role === UserRole.MODERATOR
                                  ? "bg-green-100 text-green-800"
                                  : user.role === UserRole.GUEST
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {canModify && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  if (user.isBanned)
                                    unbanMutation.mutate(user.id);
                                  else banMutation.mutate(user.id);
                                }}
                              >
                                {user.isBanned ? (
                                  <>
                                    <Undo className="mr-2 h-4 w-4" /> Unban
                                  </>
                                ) : (
                                  <>
                                    <Ban className="mr-2 h-4 w-4" /> Ban
                                  </>
                                )}
                              </DropdownMenuItem>
                              {(currentUserRole === UserRole.ADMIN ||
                                currentUserRole === UserRole.SUPER_ADMIN) && (
                                <DropdownMenuItem
                                  onClick={() => deleteMutation.mutate(user.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger className="w-full">
                                  <div className="flex items-center px-2 py-1.5 text-sm">
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Set Role
                                  </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {Object.entries(roleHierarchy)
                                    .filter(
                                      ([role]) =>
                                        roleHierarchy[role as UserRole] <
                                          roleHierarchy[
                                            currentUserRole as UserRole
                                          ] && role !== user.role,
                                    )
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([role]) => (
                                      <DropdownMenuItem
                                        key={role}
                                        onSelect={() =>
                                          setRoleMutation.mutate({
                                            userId: user.id,
                                            newRole: role as UserRole,
                                          })
                                        }
                                      >
                                        {role}
                                      </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-center gap-3">
          <Button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2.5"
          >
            <ChevronLeft className="h-3 w-3" />
            <span className="sr-only sm:not-sr-only">Prev</span>
          </Button>
          <span className="text-xs text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2.5"
          >
            <span className="sr-only sm:not-sr-only">Next</span>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
