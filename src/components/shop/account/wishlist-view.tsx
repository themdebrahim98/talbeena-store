"use client";

import { useMemo } from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductCard } from "@/components/shop/product-card";
import type { CatalogProduct } from "@/queries/shop";

interface WishlistViewProps {
  initialProducts: CatalogProduct[];
}

export function WishlistView({ initialProducts }: WishlistViewProps) {
  const { isWishlisted, isLoaded } = useWishlist();

  // Filter products based on live client wishlist state once loaded
  const activeProducts = useMemo(() => {
    if (!isLoaded) return initialProducts;
    return initialProducts.filter((p) => isWishlisted(p.slug));
  }, [initialProducts, isWishlisted, isLoaded]);

  if (activeProducts.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="size-8" />}
        title="Your wishlist is empty"
        description="Save your favourite items by clicking the heart icon on any product."
        actionHref="/products"
        actionLabel="Explore Catalog"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">My Wishlist</h2>
        <p className="text-sm text-muted-foreground">
          {activeProducts.length} item{activeProducts.length !== 1 ? "s" : ""} saved to your account.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {activeProducts.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
