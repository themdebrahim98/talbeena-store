import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type DivProps = HTMLAttributes<HTMLDivElement>;

/** Plain Tailwind avatar (initials fallback). */
export function Avatar({ className, ...props }: DivProps) {
  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 rounded-full select-none",
        className,
      )}
      {...props}
    />
  );
}

export function AvatarFallback({ className, ...props }: DivProps) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}