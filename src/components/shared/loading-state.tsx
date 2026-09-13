import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingState({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground",
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-sm">Loading…</p>
    </div>
  );
}