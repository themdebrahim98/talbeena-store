import { redirect } from "next/navigation";
import Link from "next/link";
import { Leaf, LogOut } from "lucide-react";

import { getShopUser } from "@/queries/shop";
import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/shop/sign-out-button";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getShopUser();

  if (!user) redirect("/admin/login");
  if (user.role !== "admin") redirect("/admin/forbidden");

  return (
    <div className="min-h-dvh bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-background lg:flex">
        <Link
          href="/admin"
          className="flex items-center gap-2 border-b px-5 py-4"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="size-4" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Talbeena</span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Admin
          </span>
        </Link>

        <AdminNav />

        <div className="border-t p-3">
          <p className="mb-2 truncate px-3 text-xs font-medium text-muted-foreground">
            {user.email}
          </p>
          <SignOutButton className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="size-4" />
            Sign out
          </SignOutButton>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur lg:px-8">
          <span className="text-sm font-medium text-muted-foreground">
            Talbeena Admin
          </span>
          <Link href="/" className="text-sm text-primary hover:underline">
            View store →
          </Link>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}