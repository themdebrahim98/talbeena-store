import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductCard } from "@/components/shop/product-card";
import { getCategoryBySlug, getProducts } from "@/queries/shop";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found" };

  return {
    title: `${category.name} Collection`,
    description: category.description || `Browse our range of ${category.name} products.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const { products } = await getProducts({ category: slug });

  return (
    <div className="py-10">
      <Container className="space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="size-3.5" />
          <Link href="/products" className="hover:text-foreground">Shop</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground font-medium">{category.name}</span>
        </nav>

        {/* Header */}
        <div className="space-y-2 border-b pb-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="max-w-2xl text-muted-foreground text-sm sm:text-base">
              {category.description}
            </p>
          )}
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-6">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={`No products in ${category.name} yet`}
            description="We are preparing fresh batches. Please check back soon or explore our other collections."
            actionHref="/products"
            actionLabel="View all products"
          />
        )}
      </Container>
    </div>
  );
}
