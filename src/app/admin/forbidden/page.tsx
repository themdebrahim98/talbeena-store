import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/primitives/button";

export const metadata: Metadata = {
  title: "Access denied",
  robots: { index: false, follow: false },
};

export default function AdminForbiddenPage() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-4 text-center">
      <span className="mb-6 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-8" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Access denied</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Your account doesn&apos;t have permission to view this page. Contact an
        administrator if you believe this is a mistake.
      </p>
      <div className="mt-6 flex gap-3">
        <Button render={<Link href="/" />}>Back to store</Button>
      </div>
    </div>
  );
}