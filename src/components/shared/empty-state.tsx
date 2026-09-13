import { PackageOpen } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel = "Browse products",
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-accent/50 text-muted-foreground">
        {icon ?? <PackageOpen className="size-7" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actionHref && (
        <Button size="sm" variant="outline" render={<a href={actionHref} />}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}