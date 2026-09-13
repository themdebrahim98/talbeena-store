import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type AlertVariant = "default" | "destructive";

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  default: "bg-card text-card-foreground",
  destructive:
    "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90",
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

/** Plain Tailwind alert banner. */
export function Alert({ className, variant = "default", ...props }: AlertProps) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        "relative grid w-full gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-medium", className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm text-balance text-muted-foreground", className)}
      {...props}
    />
  );
}