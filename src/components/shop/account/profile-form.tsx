"use client";

import { useActionState } from "react";

import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/primitives/alert";

import { updateProfileAction } from "@/actions/auth";

interface ProfileFormProps {
  fullName: string;
  phone: string | null;
  email: string;
}

export function ProfileForm({ fullName, phone, email }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, {});

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && (
        <Alert variant="destructive">
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.message && (
        <Alert>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled readOnly />
        <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={fullName}
          autoComplete="name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Mobile number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          defaultValue={phone ?? ""}
          placeholder="98765 43210"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}