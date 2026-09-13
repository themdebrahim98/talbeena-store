"use client";

import { useActionState } from "react";

import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/primitives/alert";

import { changePasswordAction } from "@/actions/auth";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, {});

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && (
        <Alert variant="destructive">
          <AlertTitle>Unable to update</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.message && (
        <Alert>
          <AlertDescription>{state.message}</AlertDescription>
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

      <Button type="submit" disabled={isPending}>
        {isPending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}