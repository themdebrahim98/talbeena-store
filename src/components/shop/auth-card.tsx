import Link from "next/link";
import { Leaf } from "lucide-react";

import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function AuthCard({
  title,
  subtitle,
  footer,
  className,
  children,
}: AuthCardProps) {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4 py-12">
      <div className={cn("w-full max-w-md", className)}>
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2"
          aria-label="Go to home"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="size-5" />
          </span>
          <span className="text-xl font-semibold tracking-tight">Talbeena</span>
        </Link>

        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>

        {footer && <div className="mt-4 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}