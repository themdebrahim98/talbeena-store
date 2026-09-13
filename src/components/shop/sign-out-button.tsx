"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { signOutEverywhere } from "@/lib/firebase/auth-client";

interface SignOutButtonProps {
  className?: string;
  children: ReactNode;
}

/** Shared sign-out: clears Firebase client state + server cookie, then home. */
export function SignOutButton({ className, children }: SignOutButtonProps) {
  const router = useRouter();

  async function handleClick() {
    await signOutEverywhere();
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" onClick={() => void handleClick()} className={cn(className)}>
      {children}
    </button>
  );
}