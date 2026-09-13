import Image from "next/image";
import Link from "next/link";
import { formatINR, formatWeight } from "@/lib/format";
import { discountPercent } from "@/lib/pricing";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { WishlistButton } from "@/components/shop/wishlist-button";
import type { CatalogProduct } from "@/queries/shop";

interface ProductCardProps {
  product: CatalogProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const discount = discountPercent(product.price, product.compareAtPrice);
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div>
        {/* Image wrapper */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-accent/30">
          <Link href={`/products/${product.slug}`} tabIndex={-1}>
            <Image
              src={product.primaryImageUrl || "/images/product-placeholder.svg"}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
            {discount && discount > 0 && (
              <span className="rounded-md bg-destructive px-2 py-0.5 text-[11px] font-bold tracking-tight text-destructive-foreground shadow-xs">
                -{discount}%
              </span>
            )}
            {product.isBestSeller && (
              <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-xs">
                Bestseller
              </span>
            )}
            {product.isNew && !product.isBestSeller && (
              <span className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-xs">
                New
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <div className="absolute top-2.5 right-2.5">
            <WishlistButton
              productId={product.slug}
              productName={product.name}
            />
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground shadow-xs">
                Out of stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Link
              href={`/category/${product.categorySlug}`}
              className="hover:text-foreground transition-colors hover:underline"
            >
              {product.categoryName}
            </Link>
            <span>{formatWeight(product.weight, product.unit)}</span>
          </div>

          <h3 className="font-semibold text-sm leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors">
            <Link href={`/products/${product.slug}`} className="line-clamp-2">
              {product.name}
            </Link>
          </h3>
        </div>
      </div>

      {/* Pricing & Add to Cart */}
      <div className="mt-3 pt-3 border-t space-y-2.5">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">
            {formatINR(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatINR(product.compareAtPrice)}
            </span>
          )}
        </div>

        <AddToCartButton
          productId={product.slug}
          productName={product.name}
          stock={product.stock}
          compact
        />
      </div>
    </div>
  );
}
