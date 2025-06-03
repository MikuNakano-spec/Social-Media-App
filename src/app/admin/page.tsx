"use client";

import AdminDashboard from "./AdminDashboard";
import AdminSidebar from "./AdminSidebar";


export default function Page() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <AdminDashboard />
    </div>
  );
}