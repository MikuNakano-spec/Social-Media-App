import { ChangePasswordForm } from "./ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Change Password</h1>
        <p className="text-muted-foreground">
          Secure your account with a new password
        </p>
      </div>
      <div className="max-w-md p-6 rounded-xl border bg-card">
        <ChangePasswordForm />
      </div>
    </div>
  );
}