import { Leaf } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-card text-card-foreground">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Leaf className="size-4" />
              </span>
              <span className="text-lg font-semibold tracking-tight">Talbeena</span>
            </Link>
            <p className="text-sm text-muted-foreground">{siteConfig.description}</p>
          </div>

          {/* Shop */}
          <nav className="space-y-3">
            <h4 className="text-sm font-semibold">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground transition-colors">All products</Link></li>
              <li><Link href="/category/talbina" className="hover:text-foreground transition-colors">Talbina</Link></li>
              <li><Link href="/category/dry-fruits" className="hover:text-foreground transition-colors">Dry Fruits</Link></li>
              <li><Link href="/category/dry-foods" className="hover:text-foreground transition-colors">Dry Foods</Link></li>
              <li><Link href="/category/healthy-foods" className="hover:text-foreground transition-colors">Healthy Foods</Link></li>
            </ul>
          </nav>

          {/* Account */}
          <nav className="space-y-3">
            <h4 className="text-sm font-semibold">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-foreground transition-colors">Login</Link></li>
              <li><Link href="/register" className="hover:text-foreground transition-colors">Create account</Link></li>
              <li><Link href="/account/orders" className="hover:text-foreground transition-colors">Orders</Link></li>
              <li><Link href="/cart" className="hover:text-foreground transition-colors">Cart</Link></li>
            </ul>
          </nav>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="font-semibold text-foreground">{siteConfig.contact.name}</li>
              <li>
                <a
                  href={`tel:${siteConfig.contact.phoneRaw}`}
                  className="hover:text-foreground transition-colors"
                >
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="hover:text-foreground transition-colors"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
              <li className="leading-snug">{siteConfig.contact.address}</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}