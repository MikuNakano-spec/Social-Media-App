"use client";

import LoadingButton from "@/components/LoadingButton";
import { PasswordInput } from "@/components/PasswordInput";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { changePasswordSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { initiatePasswordChange, verifyPasswordChangeCode } from "./action";
import { useSession } from "@/app/(main)/SessionProvider";
import { CheckCircle, AlertCircle } from "lucide-react";

export function ChangePasswordForm() {
  const { user } = useSession();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState("");

  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  async function onSubmit(values: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) {
    setError(undefined);
    startTransition(async () => {
      const result = await initiatePasswordChange({
        userId: user.id,
        ...values,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        setStep("verify");
      }
    });
  }

  async function handleVerifyCode(code: string) {
    setError(undefined);
    startTransition(async () => {
      const result = await verifyPasswordChangeCode({
        userId: user.id,
        code,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  if (success) {
    return (
      <div className="space-y-4 p-6 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold">Password Updated</h2>
        <p className="text-muted-foreground">
          Your password has been successfully changed
        </p>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="text-center">
          <h3 className="text-lg font-semibold">Verify Your Identity</h3>
          <p className="mt-2 text-muted-foreground">
            We sent a 6-digit code to your email
          </p>
        </div>

        <div className="flex justify-center gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <input
              key={index}
              type="text"
              className="h-12 w-12 rounded-lg border border-input text-center text-2xl uppercase focus:ring-2 focus:ring-primary"
              value={code[index] || ""}
              onChange={(e) => {
                const newValue = e.target.value
                  .replace(/[^a-zA-Z0-9]/g, "")
                  .toUpperCase();

                const newCode = code.split("");
                newCode[index] = newValue.slice(-1); 
                const finalCode = newCode.join("").slice(0, 6);
                setCode(finalCode);

                if (newValue && index < 5) {
                  const nextInput = document.getElementById(
                    `code-input-${index + 1}`,
                  );
                  nextInput?.focus();
                }

                if (finalCode.length === 6) {
                  handleVerifyCode(finalCode);
                }
              }}
              onPaste={(e) => {
                const pastedData = e.clipboardData
                  .getData("text/plain")
                  .replace(/[^a-zA-Z0-9]/g, "")
                  .toUpperCase()
                  .slice(0, 6);

                if (pastedData) {
                  setCode(pastedData);
                  if (pastedData.length === 6) {
                    handleVerifyCode(pastedData);
                  }
                }
              }}
              onFocus={(e) => e.target.select()}
              id={`code-input-${index}`}
            />
          ))}
        </div>

        <LoadingButton
          loading={isPending}
          onClick={() => handleVerifyCode(code)}
          className="h-11 w-full font-medium"
        >
          Verify Code
        </LoadingButton>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground/80">
                Current Password
              </FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="Enter current password"
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground/80">
                New Password
              </FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="Create new password"
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmNewPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground/80">
                Confirm New Password
              </FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="Re-enter new password"
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <LoadingButton
          loading={isPending}
          type="submit"
          className="h-11 w-full font-medium"
        >
          Send Verification Code
        </LoadingButton>
      </form>
    </Form>
  );
}
