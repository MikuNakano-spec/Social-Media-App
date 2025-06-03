import { Metadata } from "next";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password - WeebVerse",
};

export default function Page() {
  return (
    <main className="flex h-screen items-center justify-center p-5">
      <div className="flex h-full max-h-[40rem] w-full max-w-[64rem] overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="w-full space-y-10 overflow-y-auto p-10 md:w-1/2">
          <h1 className="text-center text-3xl font-bold">Set New Password</h1>
          <div className="space-y-5">
            <ResetPasswordForm />
          </div>
        </div>
        <div className="hidden w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 md:block" />
      </div>
    </main>
  );
}