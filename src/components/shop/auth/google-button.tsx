"use client";

import { useState } from "react";

import { Button } from "@/components/primitives/button";

import { signInWithGoogle } from "@/lib/firebase/auth-client";
import { ensureUserProfile } from "@/actions/auth";

interface GoogleButtonProps {
  mode: "signin" | "signup";
  onError: (message: string) => void;
  onSuccess: () => void;
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.9h5.35c-.5 2.4-2.55 3.5-5.35 3.5a5.9 5.9 0 1 1 0-11.8c1.5 0 2.85.55 3.9 1.45l2.05-2.05A8.85 8.85 0 1 0 12 20.9c4.45 0 8.4-3.2 8.4-8.35 0-.5-.05-.95-.05-1.45Z"
      />
    </svg>
  );
}

/**
 * Google OAuth button. After the popup it mints the server session cookie
 * and ensures an RTDB profile exists (without overwriting an existing one).
 */
export function GoogleButton({ mode, onError, onSuccess }: GoogleButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const result = await signInWithGoogle();
      const ensured = await ensureUserProfile({
        fullName: result.displayName ?? result.email?.split("@")[0] ?? "Customer",
      });
      if (!ensured.ok) {
        onError(ensured.error);
        return;
      }
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Google sign-in failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={pending}
      onClick={() => void handleClick()}
    >
      <GoogleIcon />
      {pending
        ? "Connecting…"
        : mode === "signin"
          ? "Continue with Google"
          : "Sign up with Google"}
    </Button>
  );
}