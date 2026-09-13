"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  KeyRound,
  LayoutList,
  LogOut,
  MapPin,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/shop/sign-out-button";

const items = [
  { href: "/account", label: "Profile", icon: User },
  { href: "/account/orders", label: "Orders", icon: LayoutList },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/settings", label: "Settings", icon: KeyRound },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col" aria-label="Account">
      {items.map((item) => {
        const active =
          item.href === "/account"
            ? pathname === "/account"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
      <SignOutButton className="flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive lg:mt-4">
        <LogOut className="size-4" />
        Sign out
      </SignOutButton>
    </nav>
  );
}