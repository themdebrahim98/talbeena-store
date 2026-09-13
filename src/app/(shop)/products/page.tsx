import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductCard } from "@/components/shop/product-card";
import { CatalogToolbar } from "@/components/shop/catalog-toolbar";
import { getActiveCategories, getProducts, type ProductFilters } from "@/queries/shop";

export const metadata: Metadata = {
  title: "Shop All Products",
  description:
    "Explore our complete range of authentic talbina, organic dry fruits, flours, grains, and wholesome everyday staples.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: "featured" | "price-asc" | "price-desc" | "newest";
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const params = await searchParams;
  const categories = await getActiveCategories();

  const filters: ProductFilters = {
    category: params.category,
    search: params.search,
    sort: params.sort,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
  };

  const { products, total } = await getProducts(filters);
  const activeCategory = categories.find((c) => c.slug === params.category);

  return (
    <div className="py-10">
      <Container className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {activeCategory ? activeCategory.name : "All Products"}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {activeCategory?.description ||
              "Handcrafted talbina, premium dry fruits and nutritious staples sourced for pure vitality."}
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Categories Pill Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/products"
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                !params.category
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              All ({total})
            </Link>
            {categories.map((c) => {
              const isSelected = params.category === c.slug;
              const query = new URLSearchParams();
              if (!isSelected) query.set("category", c.slug);
              if (params.search) query.set("search", params.search);
              if (params.sort) query.set("sort", params.sort);
              const href = `/products?${query.toString()}`;

              return (
                <Link
                  key={c.slug}
                  href={href}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <CatalogToolbar />
        </div>

        {/* Product Grid or Empty State */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-6">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No matching products found"
            description="Try changing your search keywords or switching category filters."
            actionHref="/products"
            actionLabel="Reset filters"
          />
        )}
      </Container>
    </div>
  );
}
