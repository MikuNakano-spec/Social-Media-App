import Link from "next/link";
import { Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
      <div className="grid gap-4">
        <Link
          href="/settings/change-password"
          className="group p-6 rounded-xl border bg-card hover:bg-accent/30 transition-all hover:shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                Change Password
              </h2>
              <p className="text-muted-foreground mt-1">
                Update your account security credentials
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}