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
import { Input } from "@/components/ui/input";
import { loginSchema, LoginValues } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { login } from "./actions";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginForm() {
  const [error, setError] = useState<string>();

  const [isPending, startTransition] = useTransition();

  const [rateLimit, setRateLimit] = useState<{
    remaining: number;
    reset?: number;
  } | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginValues) {
    setError(undefined);
    setRateLimit(null);
    startTransition(async () => {
      const result = await login(values);
      if (result.error) setError(result.error);
      if (result.rateLimit) setRateLimit(result.rateLimit);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <span className="mr-2">⚠️</span>
            <AlertDescription className="text-center">{error}</AlertDescription>
          </Alert>
        )}
        {rateLimit && (
          <Alert variant="default">
            <span className="mr-2">⏱️</span>
            <AlertDescription className="text-center">
              {rateLimit.remaining > 0
                ? `Bạn còn ${rateLimit.remaining} lần thử đăng nhập`
                : rateLimit.reset
                  ? `Vui lòng thử lại sau ${new Date(rateLimit.reset * 1000).toLocaleTimeString()}`
                  : "Vui lòng thử lại sau một thời gian"}
            </AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder="Password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <LoadingButton loading={isPending} type="submit" className="w-full">
          Log in
        </LoadingButton>
      </form>
    </Form>
  );
}
