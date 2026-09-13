"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, Tag, Check, Truck } from "lucide-react";

import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { EmptyState } from "@/components/shared/empty-state";
import { formatINR } from "@/lib/format";
import { computeShipping } from "@/lib/shipping";
import { businessConfig } from "@/config/business";
import type { CatalogProduct } from "@/queries/shop";

interface CartViewProps {
  products: CatalogProduct[];
}

export function CartView({ products }: CartViewProps) {
  const { lines, updateQuantity, removeItem, count } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponError, setCouponError] = useState("");

  const productsMap = new Map<string, CatalogProduct>(
    products.map((p) => [p.slug, p]),
  );

  const cartItems = lines
    .map((line) => {
      const product = productsMap.get(line.productId);
      if (!product) return null;
      return {
        ...line,
        product,
        lineTotal: product.price * line.quantity,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.lineTotal, 0);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === "WELCOME10") {
      setAppliedCoupon({ code, percent: 10 });
      setCouponCode("");
    } else {
      setCouponError("Invalid or expired coupon code");
    }
  };

  const discountAmount = appliedCoupon
    ? Math.round((subtotal * appliedCoupon.percent) / 100)
    : 0;

  const shipping = computeShipping(subtotal);
  const total = Math.max(0, subtotal - discountAmount + shipping);

  const freeShippingThreshold = businessConfig.shipping.freeShippingAbove;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  if (count === 0 || cartItems.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-8" />}
        title="Your cart is currently empty"
        description="Looks like you haven't added any delicious talbina or wholesome staples yet."
        actionHref="/products"
        actionLabel="Start Shopping"
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
      {/* Items column */}
      <div className="space-y-6 lg:col-span-8">
        {/* Free shipping banner */}
        <div className="rounded-2xl border bg-accent/30 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-foreground">
              <Truck className="size-4 text-primary" />
              {amountToFreeShipping === 0 ? (
                <span className="text-emerald-700 font-bold">You unlocked FREE shipping!</span>
              ) : (
                <span>
                  Add <strong className="text-primary">{formatINR(amountToFreeShipping)}</strong> more to get FREE Delivery
                </span>
              )}
            </span>
            <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Table/List of items */}
        <div className="rounded-3xl border bg-card divide-y overflow-hidden shadow-xs">
          {cartItems.map(({ product, quantity, lineTotal }) => (
            <div key={product.slug} className="flex gap-4 p-4 sm:p-5">
              {/* Product Thumbnail */}
              <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-xl border bg-muted/30">
                <Image
                  src={product.primaryImageUrl || "/images/product-placeholder.svg"}
                  alt={product.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>

              {/* Item Info */}
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-2">
                  <div>
                    <Link
                      href={`/category/${product.categorySlug}`}
                      className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      {product.categoryName}
                    </Link>
                    <h3 className="font-semibold text-sm sm:text-base leading-snug">
                      <Link href={`/products/${product.slug}`} className="hover:underline">
                        {product.name}
                      </Link>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatINR(product.price)} each
                    </p>
                  </div>
                  <span className="text-sm font-bold text-foreground sm:text-base">
                    {formatINR(lineTotal)}
                  </span>
                </div>

                {/* Quantity Controls & Remove */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-lg border bg-background p-0.5 shadow-xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => updateQuantity(product.slug, null, quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-8 text-center text-xs font-semibold tabular-nums">
                      {quantity}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={quantity >= product.stock}
                      onClick={() => updateQuantity(product.slug, null, quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(product.slug, null)}
                    className="text-xs text-muted-foreground hover:text-destructive gap-1.5"
                  >
                    <Trash2 className="size-3.5" />
                    <span className="hidden sm:inline">Remove</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary column */}
      <div className="space-y-6 lg:col-span-4">
        <div className="rounded-3xl border bg-card p-6 shadow-xs space-y-6">
          <h2 className="text-lg font-bold tracking-tight">Order Summary</h2>

          {/* Coupon Input */}
          <div className="space-y-2">
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon code"
                  className="pl-8 text-xs h-9 uppercase"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary" className="h-9 text-xs">
                Apply
              </Button>
            </form>

            {appliedCoupon && (
              <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700">
                <span className="flex items-center gap-1">
                  <Check className="size-3.5" /> {appliedCoupon.code} applied (-{appliedCoupon.percent}%)
                </span>
                <button
                  type="button"
                  onClick={() => setAppliedCoupon(null)}
                  className="text-[11px] underline hover:text-emerald-900"
                >
                  Remove
                </button>
              </div>
            )}

            {couponError && (
              <p className="text-xs text-destructive">{couponError}</p>
            )}
          </div>

          {/* Breakdown */}
          <div className="space-y-2.5 text-sm border-t pt-4">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="text-foreground font-medium">{formatINR(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Coupon Discount</span>
                <span>-{formatINR(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Fee</span>
              <span>{shipping === 0 ? "FREE" : formatINR(shipping)}</span>
            </div>

            <div className="flex justify-between border-t pt-3 text-base font-bold text-foreground">
              <span>Total</span>
              <span className="text-xl text-primary">{formatINR(total)}</span>
            </div>
          </div>

          {/* Proceed button */}
          <Button
            size="lg"
            className="w-full gap-2 shadow-xs"
            render={<Link href={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}` : ""}`} />}
          >
            Proceed to Checkout
            <ArrowRight className="size-4" />
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            Tax included. Secure payment powered by Razorpay or COD.
          </p>
        </div>
      </div>
    </div>
  );
}
