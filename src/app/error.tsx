"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/primitives/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root boundary caught an error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            We encountered an unexpected error while preparing this page. Please try refreshing.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => reset()} className="gap-2">
            <RotateCcw className="size-4" /> Try Again
          </Button>
          <Button variant="outline" render={<Link href="/" />}>
            <Home className="size-4 mr-2" /> Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
