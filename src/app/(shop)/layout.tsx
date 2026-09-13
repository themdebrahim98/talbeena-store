import { SiteHeader } from "@/components/shop/site-header";
import { SiteFooter } from "@/components/shop/site-footer";

import { getActiveCategories, getShopUser } from "@/queries/shop";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The header needs current auth/categories, so this layout is dynamic.
  const [user, categories] = await Promise.all([
    getShopUser(),
    getActiveCategories(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader categories={categories} user={user} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}