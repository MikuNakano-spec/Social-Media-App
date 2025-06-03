"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { FiUsers, FiFileText, FiAlertTriangle, FiGrid, FiLogOut, FiDollarSign, FiChevronRight } from "react-icons/fi";
import { logout } from "../(auth)/actions";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", href: "/admin", icon: <FiGrid size={20} /> },
  { name: "Users", href: "/admin/users", icon: <FiUsers size={20} /> },
  { name: "Posts", href: "/admin/posts", icon: <FiFileText size={20} /> },
  { name: "Comments", href: "/admin/comments", icon: <MessageSquare size={20} /> },
  { name: "Reports", href: "/admin/reports", icon: <FiAlertTriangle size={20} /> },
  { name: "Premium", href: "/admin/premium-users", icon: <FiDollarSign size={20} /> },
];

const AdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    router.replace("/login");
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 p-6 shadow-xl sticky top-0 h-screen flex flex-col">
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <div className="bg-blue-500 w-8 h-8 rounded-lg flex items-center justify-center">
            <FiGrid size={20} className="text-white" />
          </div>
          AdminHub
        </h2>
        <p className="text-slate-400 text-sm mt-1">Management Portal</p>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map(({ name, href, icon }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group",
                    isActive 
                      ? "bg-blue-500/20 border-l-4 border-blue-500 text-white"
                      : "text-slate-300 hover:bg-slate-700/50 hover:pl-6"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "transition-colors",
                      isActive ? "text-blue-400" : "text-slate-400 group-hover:text-blue-300"
                    )}>
                      {icon}
                    </span>
                    <span className="font-medium">{name}</span>
                  </div>
                  {!isActive && (
                    <FiChevronRight 
                      size={16} 
                      className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" 
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        onClick={handleLogout}
        disabled={loading}
        className="mt-6 flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors group"
      >
        <FiLogOut size={20} className="text-slate-400 group-hover:text-red-400 transition-colors" />
        <span className="font-medium">{loading ? "Logging Out..." : "Logout"}</span>
        {loading && (
          <div className="ml-2 h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        )}
      </button>
    </aside>
  );
};

export default AdminSidebar;