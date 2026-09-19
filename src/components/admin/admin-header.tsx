"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Leaf, LogOut, Menu } from "lucide-react";

import { Button } from "@/components/primitives/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/primitives/sheet";
import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/shop/sign-out-button";

interface AdminHeaderProps {
  userEmail?: string;
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur lg:px-8">
      {/* Mobile Drawer Trigger & Title */}
      <div className="flex items-center gap-2.5 lg:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open admin navigation menu"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>

          <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
            <SheetHeader className="border-b px-5 py-4">
              <SheetTitle className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Leaf className="size-4" />
                </span>
                <span className="text-lg font-semibold tracking-tight">Talbeena</span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Admin
                </span>
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto py-2">
              <AdminNav onNavigate={() => setMobileMenuOpen(false)} />
            </div>

            <div className="border-t p-3 bg-muted/20">
              {userEmail && (
                <p className="mb-2 truncate px-3 text-xs font-medium text-muted-foreground">
                  {userEmail}
                </p>
              )}
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="mb-1 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ExternalLink className="size-4" />
                View live store
              </Link>
              <SignOutButton className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="size-4" />
                Sign out
              </SignOutButton>
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile Header Title */}
        <div className="flex items-center gap-1.5">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="size-3" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Talbeena</span>
          <span className="rounded bg-primary/10 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
            Admin
          </span>
        </div>
      </div>

      {/* Desktop Title */}
      <span className="hidden text-sm font-medium text-muted-foreground lg:inline-block">
        Talbeena Admin Dashboard
      </span>

      {/* Header Actions */}
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:underline sm:text-sm"
        >
          <span>View store</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </header>
  );
}
