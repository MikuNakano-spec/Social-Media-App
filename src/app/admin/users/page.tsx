import { Metadata } from "next";
import AdminUsers from "./AdminUsers";
import AdminSidebar from "../AdminSidebar";

export const metadata: Metadata = {
  title: "Admin Users",
};

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-5">
        <div className="flex w-full min-w-0 gap-5">
          <div className="w-full min-w-0">
            <div className="bg-card p-3 shadow-sm">
              <h1 className="text-center text-2xl font-bold">Manage Users</h1>
            </div>
            <AdminUsers />
          </div>
        </div>
      </main>
    </div>
  );
}