"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/primitives/button";

interface ErrorStateProps {
  title?: string;
  description?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again.",
}: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center"
      role="alert"
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
        <RefreshCw className="mr-2 size-4" />
        Retry
      </Button>
    </div>
  );
}