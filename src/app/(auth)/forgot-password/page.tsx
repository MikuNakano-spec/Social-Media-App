import { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password - WeebVerse",
};

export default function Page() {
  return (
    <main className="flex h-screen items-center justify-center p-5">
      <div className="flex h-full max-h-[40rem] w-full max-w-[64rem] overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="w-full space-y-10 overflow-y-auto p-10 md:w-1/2">
          <h1 className="text-center text-3xl font-bold">Reset Your Password</h1>
          <div className="space-y-5">
            <ForgotPasswordForm />
            <Link 
              href="/login" 
              className="block text-center text-muted-foreground hover:underline"
            >
              Remember your password? Sign in
            </Link>
          </div>
        </div>
        <div className="hidden w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 md:block" />
      </div>
    </main>
  );
}