import TrendsSidebar from "@/components/TrendsSidebar";
import { Metadata } from "next";
import Bookmarks from "./Bookmarks";
import { getServerTranslation } from "@/lib/i18n/getServerTranslation";

export const metadata: Metadata = {
  title: "Bookmarks",
};

export default function Page() {
  const t = getServerTranslation();
  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h1 className="text-center text-2xl font-bold">{t.bookmarks}</h1>
        </div>
        <Bookmarks />
      </div>
      <TrendsSidebar />
    </main>
  );
}
