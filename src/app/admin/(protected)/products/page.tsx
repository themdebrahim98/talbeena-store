import Link from "next/link";
import Image from "next/image";
import { PackagePlus } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { CustomSelect, type SelectOption } from "@/components/primitives/custom-select";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { formatINR } from "@/lib/format";
import { getAdminProducts, getAllCategories } from "@/queries/admin";

export const metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

function StockBadge({ stock, threshold }: { stock: number; threshold: number }) {
  if (stock <= 0) {
    return (
      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        Out of stock
      </span>
    );
  }
  if (stock <= threshold) {
    return (
      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
        Low ({stock})
      </span>
    );
  }
  return <span className="text-sm tabular-nums">{stock}</span>;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = "", category = "" } = await searchParams;
  const [products, categories] = await Promise.all([
    getAdminProducts(),
    getAllCategories(),
  ]);

  const query = q.trim().toLowerCase();
  const filtered = products.filter((p) => {
    const matchesQuery =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.slug.toLowerCase().includes(query);
    const matchesCategory = !category || p.categorySlug === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} product{products.length === 1 ? "" : "s"} in the catalog.
          </p>
        </div>
        <Button render={<Link href="/admin/products/new" />}>
          <PackagePlus className="mr-2 size-4" />
          Add product
        </Button>
      </div>

      <form method="get" className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search name, SKU or slug…"
          aria-label="Search products"
          className="w-full sm:max-w-xs h-9 rounded-xl bg-card"
        />
        <div className="flex items-center gap-2">
          <CustomSelect
            name="category"
            defaultValue={category}
            options={[
              { value: "", label: "All categories" },
              ...categories.map((c) => ({
                value: c.slug,
                label: c.name,
                badge: c.isActive ? undefined : "inactive",
              })),
            ]}
            placeholder="All categories"
            className="flex-1 sm:w-48"
            autoSubmit={true}
          />
          <Button type="submit" variant="outline" size="sm" className="h-9 rounded-xl px-3 text-xs">
            Filter
          </Button>
          {(q || category) && (
            <Button variant="ghost" size="sm" className="h-9 rounded-xl px-3 text-xs" render={<Link href="/admin/products" />}>
              Clear
            </Button>
          )}
        </div>
      </form>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
          <p className="text-sm font-medium">No products found</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {products.length === 0
              ? "Your catalog is empty. Add your first product to get started."
              : "Try a different search or category filter."}
          </p>
          {products.length === 0 && (
            <Button
              size="sm"
              variant="outline"
              className="mt-4 rounded-xl"
              render={<Link href="/admin/products/new" />}
            >
              Add product
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Product Cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((p) => (
              <div
                key={p.slug}
                className="rounded-2xl border bg-card p-3.5 shadow-xs space-y-3 transition hover:border-primary/40"
              >
                <div className="flex items-start gap-3">
                  {p.primaryImageUrl ? (
                    <Image
                      src={p.primaryImageUrl}
                      alt=""
                      width={56}
                      height={56}
                      className="size-14 shrink-0 rounded-xl border object-cover bg-muted/20"
                    />
                  ) : (
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-dashed text-[10px] text-muted-foreground bg-muted/10">
                      No img
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-semibold text-sm text-foreground truncate">{p.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.2 font-mono text-[10px]">{p.sku}</span>
                      <span>·</span>
                      <span className="truncate">{p.categoryName}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 pt-0.5">
                      <span className="text-sm font-bold text-foreground">{formatINR(p.price)}</span>
                      {p.compareAtPrice != null && p.compareAtPrice > p.price && (
                        <span className="text-[11px] text-muted-foreground line-through">
                          {formatINR(p.compareAtPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StockBadge stock={p.stock} threshold={p.lowStockThreshold} />
                    {!p.isActive && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Hidden
                      </span>
                    )}
                    {p.isFeatured && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Featured
                      </span>
                    )}
                    {p.isBestSeller && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Best seller
                      </span>
                    )}
                    {p.isNew && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        New
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2.5 rounded-lg"
                      render={<Link href={`/admin/products/${p.slug}`} />}
                    >
                      Edit
                    </Button>
                    <DeleteProductButton slug={p.slug} name={p.name} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border bg-card shadow-xs">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground bg-muted/20">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.slug} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.primaryImageUrl ? (
                          <Image
                            src={p.primaryImageUrl}
                            alt=""
                            width={40}
                            height={40}
                            className="size-10 shrink-0 rounded-lg border object-cover"
                          />
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-dashed text-[10px] text-muted-foreground">
                            No img
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="truncate text-xs text-muted-foreground font-mono">
                            {p.sku} · /{p.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.categoryName}</td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-semibold">{formatINR(p.price)}</span>
                      {p.compareAtPrice != null && p.compareAtPrice > p.price && (
                        <span className="ml-1.5 text-xs text-muted-foreground line-through">
                          {formatINR(p.compareAtPrice)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge stock={p.stock} threshold={p.lowStockThreshold} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {!p.isActive && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            Hidden
                          </span>
                        )}
                        {p.isFeatured && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Featured
                          </span>
                        )}
                        {p.isBestSeller && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Best seller
                          </span>
                        )}
                        {p.isNew && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            New
                          </span>
                        )}
                        {p.isActive && !p.isFeatured && !p.isBestSeller && !p.isNew && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/products/${p.slug}`}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                        >
                          Edit
                        </Link>
                        <DeleteProductButton slug={p.slug} name={p.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
