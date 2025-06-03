import { Metadata } from "next";
import AdminSidebar from "../AdminSidebar";
import ReportTable from "./AdminReports";

export const metadata: Metadata = {
  title: "Admin Reports Management",
};

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-5">
        <div className="flex w-full min-w-0 gap-5">
          <div className="w-full min-w-0">
            <div className=" bg-card p-5 shadow-sm">
              <h1 className="text-center text-2xl font-bold">Manage Report</h1>
            </div>
            <ReportTable />
          </div>
        </div>
      </main>
    </div>
  );
}