"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  Home,
  LayoutDashboard,
  LayoutGrid,
  Leaf,
  LogIn,
  LogOut,
  MapPin,
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
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:px-6">
        {/* Left: Mobile menu + Logo + Desktop Nav */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open menu"
                    className="size-9 rounded-xl hover:bg-muted active:scale-95 transition"
                  />
                }
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="flex w-80 max-w-[85vw] flex-col gap-4 p-5">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                      <Leaf className="size-4" />
                    </span>
                    Talbeena
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto pr-1">
                  <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                    {user?.role === "admin" && (
                      <div className="mb-3 rounded-xl border border-primary/20 bg-primary/10 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <LayoutDashboard className="size-4 text-primary shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">Admin Mode</span>
                          </div>
                          <SheetClose
                            render={
                              <Link
                                href="/admin"
                                onClick={() => setMenuOpen(false)}
                                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90"
                              >
                                Go to Admin →
                              </Link>
                            }
                          />
                        </div>
                      </div>
                    )}

                    <MobileNavLink href="/" label="Home" icon={Home} onNavigate={() => setMenuOpen(false)} />
                    <MobileNavLink
                      href="/products"
                      label="Shop All"
                      icon={Package}
                      onNavigate={() => setMenuOpen(false)}
                    />
                    {categories.length > 0 && (
                      <div className="my-1 border-t pt-2">
                        <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Categories
                        </p>
                        {categories.map((c) => (
                          <MobileNavLink
                            key={c.slug}
                            href={`/category/${c.slug}`}
                            label={c.name}
                            icon={LayoutGrid}
                            onNavigate={() => setMenuOpen(false)}
                          />
                        ))}
                      </div>
                    )}
                    <div className="my-1 border-t pt-2">
                      <MobileNavLink
                        href="/account/wishlist"
                        label="Wishlist"
                        icon={Heart}
                        onNavigate={() => setMenuOpen(false)}
                      />
                    </div>
                    {user ? (
                      <div className="my-1 border-t pt-2">
                        <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Account ({user.email})
                        </p>
                        {user.role === "admin" && (
                          <MobileNavLink
                            href="/admin"
                            label="Admin Dashboard"
                            icon={LayoutDashboard}
                            badge="Admin"
                            onNavigate={() => setMenuOpen(false)}
                          />
                        )}
                        <MobileNavLink
                          href="/account"
                          label="Profile"
                          icon={User}
                          onNavigate={() => setMenuOpen(false)}
                        />
                        <MobileNavLink
                          href="/account/orders"
                          label="Orders"
                          icon={ShoppingBag}
                          onNavigate={() => setMenuOpen(false)}
                        />
                        <MobileNavLink
                          href="/account/addresses"
                          label="Addresses"
                          icon={MapPin}
                          onNavigate={() => setMenuOpen(false)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            void handleSignOut();
                          }}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <LogOut className="size-4" />
                          Sign out
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 flex gap-2 border-t pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          render={<Link href="/login" onClick={() => setMenuOpen(false)} />}
                        >
                          Login
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          render={<Link href="/register" onClick={() => setMenuOpen(false)} />}
                        >
                          Sign up
                        </Button>
                      </div>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Talbeena home"
          >
            <span className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Leaf className="size-4 sm:size-4.5" />
            </span>
            <span className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Talbeena
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden items-center gap-1 ml-2 lg:flex"
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
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {user?.role === "admin" && (
            <Button
              variant="outline"
              size="sm"
              className="inline-flex items-center gap-1.5 rounded-full border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 hover:text-primary transition"
              render={<Link href="/admin" />}
            >
              <Package className="size-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            aria-label="Cart"
            className="relative size-9 rounded-xl hover:bg-muted active:scale-95 transition"
            render={<Link href="/cart" />}
          >
            <ShoppingCart className="size-5" />
            <CartCountBadge />
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Account"
                    className="size-9 rounded-full p-0 transition active:scale-95"
                  />
                }
              >
                <Avatar className="size-8.5 rounded-full ring-2 ring-primary/20 ring-offset-1 ring-offset-background transition hover:ring-primary/50">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
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
                {user.role === "admin" && (
                  <>
                    <DropdownMenuItem
                      render={<Link href="/admin" />}
                      className="font-semibold text-primary bg-primary/10 hover:bg-primary/15"
                    >
                      <LayoutDashboard className="mr-2 size-4 text-primary" /> Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
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
  icon: Icon,
  badge,
  onNavigate,
}: {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  onNavigate: () => void;
}) {
  return (
    <SheetClose
      render={<Link href={href} onClick={onNavigate} />}
      className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
    >
      <span className="flex items-center gap-3">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        <span>{label}</span>
      </span>
      {badge && (
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          {badge}
        </span>
      )}
    </SheetClose>
  );
}