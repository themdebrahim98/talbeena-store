import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Banknote,
  ChevronRight,
  Leaf,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { Container } from "@/components/shared/container";
import { ProductGallery } from "@/components/shop/product-gallery";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { ProductCard } from "@/components/shop/product-card";
import { ProductReviews } from "@/components/shop/product-reviews";
import { StarRating } from "@/components/shop/star-rating";
import { formatINR, formatWeight } from "@/lib/format";
import { discountPercent, savingsPerUnit } from "@/lib/pricing";
import {
  getProductBySlug,
  getRelatedProducts,
  getProductReviews,
  checkCustomerPurchasedProduct,
  getShopUser,
} from "@/queries/shop";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) return { title: "Product Not Found" };

  return {
    title: data.product.name,
    description: data.product.description,
    openGraph: {
      title: data.product.name,
      description: data.product.description,
      images: data.images[0] ? [data.images[0].url] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const data = await getProductBySlug(slug);

  if (!data) {
    notFound();
  }

  const { product, images, ingredientsList, tagsList } = data;
  const discount = discountPercent(product.price, product.compareAtPrice);
  const savings = savingsPerUnit(product.price, product.compareAtPrice);

  const user = await getShopUser();
  const [related, reviewsSummary, isVerifiedBuyer] = await Promise.all([
    getRelatedProducts(product.categorySlug, product.slug),
    getProductReviews(product.slug),
    user ? checkCustomerPurchasedProduct(user.id, product.slug) : Promise.resolve(false),
  ]);

  return (
    <div className="py-8 lg:py-12">
      <Container className="space-y-12">
        {/* Breadcrumb navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="size-3.5" />
          <Link href="/products" className="hover:text-foreground">Shop</Link>
          <ChevronRight className="size-3.5" />
          <Link href={`/category/${product.categorySlug}`} className="hover:text-foreground">
            {product.categoryName}
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="truncate text-foreground font-medium max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        {/* Product Details Hero */}
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Gallery */}
          <div>
            <ProductGallery images={images} productName={product.name} />
          </div>

          {/* Buying details */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/category/${product.categorySlug}`}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  {product.categoryName}
                </Link>
                {product.isBestSeller && (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700">
                    Bestseller
                  </span>
                )}
                {product.isNew && (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Fresh Harvest
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  SKU: {product.sku}
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {product.name}
              </h1>

              {/* Rating summary badge */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-1.5">
                  <StarRating value={reviewsSummary.averageRating} size="sm" />
                  <span className="text-xs font-bold text-foreground">
                    {reviewsSummary.averageRating > 0 ? reviewsSummary.averageRating.toFixed(1) : "New"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">•</span>
                <a
                  href="#reviews"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {reviewsSummary.totalReviews}{" "}
                  {reviewsSummary.totalReviews === 1 ? "customer review" : "customer reviews"}
                </a>
              </div>

              <p className="text-sm font-medium text-muted-foreground">
                Net weight: {formatWeight(product.weight, product.unit)}
              </p>
            </div>

            {/* Price & Savings */}
            <div className="rounded-2xl border bg-card/60 p-4 space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {formatINR(product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="text-base text-muted-foreground line-through">
                    {formatINR(product.compareAtPrice)}
                  </span>
                )}
                {discount && discount > 0 && (
                  <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                    Save {discount}%
                  </span>
                )}
              </div>
              {savings > 0 && (
                <p className="text-xs font-medium text-emerald-700">
                  You save {formatINR(savings)} on this pack
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Inclusive of all taxes. Free shipping on orders over ₹500.
              </p>
            </div>

            {/* Actions (Add to Cart + Wishlist) */}
            <div className="space-y-4">
              <AddToCartButton
                productId={product.slug}
                productName={product.name}
                stock={product.stock}
                showStepper
              />
              <WishlistButton
                productId={product.slug}
                productName={product.name}
                variant="full"
                className="w-full"
              />
            </div>

            {/* Trust Assurances */}
            <div className="grid grid-cols-2 gap-3 border-y py-4">
              <div className="flex items-center gap-2.5">
                <Truck className="size-4 text-primary shrink-0" />
                <span className="text-xs font-medium">Pan-India delivery in 24–48h</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Banknote className="size-4 text-primary shrink-0" />
                <span className="text-xs font-medium">Cash on Delivery available</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Leaf className="size-4 text-primary shrink-0" />
                <span className="text-xs font-medium">100% natural, no preservatives</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-4 text-primary shrink-0" />
                <span className="text-xs font-medium">Hygienically hand-packed</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </h2>
              <p className="text-sm leading-relaxed text-foreground/90">
                {product.description}
              </p>
            </div>

            {/* Ingredients */}
            {ingredientsList.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Wholesome Ingredients
                </h2>
                <div className="flex flex-wrap gap-2">
                  {ingredientsList.map((ing) => (
                    <span
                      key={ing}
                      className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground"
                    >
                      <BadgeCheck className="size-3.5 text-primary" />
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags / Benefits */}
            {tagsList.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Health &amp; Dietary Notes
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {tagsList.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-accent-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div id="reviews">
          <ProductReviews
            productId={product.slug}
            productName={product.name}
            initialSummary={reviewsSummary}
            isLoggedIn={Boolean(user)}
            isVerifiedBuyer={isVerifiedBuyer}
          />
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="pt-12 border-t space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                You might also enjoy
              </h2>
              <p className="text-sm text-muted-foreground">
                More nutritious picks from {product.categoryName}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.slug} product={item} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
