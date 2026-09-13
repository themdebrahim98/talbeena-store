"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/primitives/alert";
import { AuthCard } from "@/components/shop/auth-card";
import { LoadingState } from "@/components/shared/loading-state";

import { isFirebaseConfigured } from "@/lib/firebase/env";
import { confirmReset } from "@/lib/firebase/auth-client";
import { resetPasswordSchema } from "@/validations/auth";

function ResetPasswordBody() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  const linkValid =
    isFirebaseConfigured() && mode === "resetPassword" && !!oobCode;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const parsed = resetPasswordSchema.safeParse({
      password: form.get("password"),
      confirmPassword: form.get("confirmPassword"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    if (!oobCode) {
      setError("This reset link is invalid or has expired.");
      return;
    }

    setPending(true);
    try {
      await confirmReset(oobCode, parsed.data.password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setPending(false);
    }
  }

  if (!linkValid) {
    return (
      <AuthCard
        title="Invalid or expired link"
        subtitle="This password reset link is invalid or has expired. Request a new one to continue."
        footer={
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Request a new link
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          {!isFirebaseConfigured()
            ? "Password reset is not configured yet. Add Firebase keys to .env.local."
            : "If you keep seeing this, close this tab and start the reset flow again."}
        </p>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard
        title="Password updated"
        subtitle="Your password has been changed. You can now sign in."
        footer={
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          Use your new password the next time you sign in.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Use at least 8 characters for your new password"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Unable to update</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Reset password">
          <LoadingState />
        </AuthCard>
      }
    >
      <ResetPasswordBody />
    </Suspense>
  );
}