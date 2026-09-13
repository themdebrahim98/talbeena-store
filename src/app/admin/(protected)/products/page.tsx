import Link from "next/link";
import Image from "next/image";
import { PackagePlus } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
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

      <form method="get" className="flex flex-wrap gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search name, SKU or slug…"
          aria-label="Search products"
          className="max-w-xs"
        />
        <select
          name="category"
          defaultValue={category}
          aria-label="Filter by category"
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          Filter
        </Button>
        {(q || category) && (
          <Button variant="ghost" size="sm" render={<Link href="/admin/products" />}>
            Clear
          </Button>
        )}
      </form>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
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
              className="mt-4"
              render={<Link href="/admin/products/new" />}
            >
              Add product
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-3xl text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
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
                <tr key={p.slug} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.primaryImageUrl ? (
                        <Image
                          src={p.primaryImageUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="size-10 shrink-0 rounded-md border object-cover"
                        />
                      ) : (
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-dashed text-[10px] text-muted-foreground">
                          No img
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.sku} · /{p.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.categoryName}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatINR(p.price)}
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
                        className="rounded-md px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
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
      )}
    </div>
  );
}
