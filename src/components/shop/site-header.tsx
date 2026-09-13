"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Leaf,
  LogIn,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  ShoppingCart,
  User,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/primitives/button";
import { Separator } from "@/components/primitives/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/primitives/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/primitives/sheet";
import { Avatar, AvatarFallback } from "@/components/primitives/avatar";

import { CartCountBadge } from "@/components/shop/cart-count-badge";
import { signOutEverywhere } from "@/lib/firebase/auth-client";

interface HeaderCategory {
  name: string;
  slug: string;
}

interface HeaderUser {
  fullName: string | null;
  email: string;
  role: string;
}

interface SiteHeaderProps {
  categories: HeaderCategory[];
  user?: HeaderUser | null;
}

export function SiteHeader({ categories, user }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOutEverywhere();
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const initials =
    user?.fullName
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? (user?.email?.[0]?.toUpperCase() ?? "U");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 lg:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" aria-label="Open menu" />}
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="flex w-80 flex-col gap-6">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Leaf className="size-4" />
                  </span>
                  Talbeena
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                <MobileNavLink href="/" label="Home" onNavigate={() => setMenuOpen(false)} />
                <MobileNavLink
                  href="/products"
                  label="Shop All"
                  onNavigate={() => setMenuOpen(false)}
                />
                {categories.map((c) => (
                  <MobileNavLink
                    key={c.slug}
                    href={`/category/${c.slug}`}
                    label={c.name}
                    onNavigate={() => setMenuOpen(false)}
                  />
                ))}
                <Separator className="my-2" />
                <MobileNavLink
                  href="/account/wishlist"
                  label="Wishlist"
                  onNavigate={() => setMenuOpen(false)}
                />
                {!user && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      render={<Link href="/login" />}
                    >
                      Login
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      render={<Link href="/register" />}
                    >
                      Sign up
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="Talbeena home">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="size-5" />
          </span>
          <span className="hidden text-lg font-semibold tracking-tight sm:block">
            Talbeena
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Main navigation"
        >
          <NavLink href="/" label="Home" active={isActive("/")} />
          <NavLink
            href="/products"
            label="Shop"
            active={isActive("/products")}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    isActive("/category")
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }
                />
              }
            >
              <LayoutGrid className="mr-2 size-4" />
              Categories
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem render={<Link href="/products" />}>
                All products
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {categories.map((c) => (
                <DropdownMenuItem key={c.slug} render={<Link href={`/category/${c.slug}`} />}>
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {user?.role === "admin" && (
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              render={<Link href="/admin" />}
            >
              <Package className="mr-2 size-4" />
              Admin
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            aria-label="Cart"
            render={<Link href="/cart" className="relative" />}
          >
            <ShoppingCart className="size-5" />
            <CartCountBadge />
          </Button>

          {user ? (
            <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Account" />
              }
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="truncate font-medium">{user.fullName ?? "My account"}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/account" />}>
                <User className="mr-2 size-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/account/orders" />}>
                <Package className="mr-2 size-4" /> Orders
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/account/addresses" />}>
                <LayoutGrid className="mr-2 size-4" /> Addresses
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/account/wishlist" />}>
                <ShoppingBag className="mr-2 size-4" /> Wishlist
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => void handleSignOut()}
              >
                <LogOut className="mr-2 size-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              render={<Link href="/login" />}
            >
              <LogIn className="mr-2 size-4" />
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-accent/60 text-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <SheetClose
      render={<Link href={href} onClick={onNavigate} />}
      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
    >
      {label}
    </SheetClose>
  );
}