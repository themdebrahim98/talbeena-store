"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  productId: string;
  variantId?: string | null;
  productName: string;
  stock: number;
  showStepper?: boolean;
  className?: string;
  compact?: boolean;
}

export function AddToCartButton({
  productId,
  variantId = null,
  productName,
  stock,
  showStepper = false,
  className,
  compact = false,
}: AddToCartButtonProps) {
  const router = useRouter();
  const { addItem, isPending } = useCart();
  const [quantity, setQuantity] = useState(1);
  const isOutOfStock = stock <= 0;

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isOutOfStock) return;
    addItem(productId, variantId, quantity, productName);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem(productId, variantId, quantity, productName);
    router.push("/checkout");
  };

  if (compact) {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled={isOutOfStock || isPending}
        onClick={handleAddToCart}
        className={cn("w-full gap-1.5 font-medium", className)}
      >
        <ShoppingCart className="size-3.5" />
        {isOutOfStock ? "Out of stock" : "Add to cart"}
      </Button>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {showStepper && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Quantity</span>
          <div className="flex items-center rounded-lg border bg-card p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={quantity <= 1 || isOutOfStock}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
            >
              <Minus className="size-3.5" />
            </Button>
            <span className="w-10 text-center text-sm font-semibold tabular-nums">
              {quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={quantity >= stock || isOutOfStock}
              onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
              aria-label="Increase quantity"
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
          {stock > 0 && stock <= 10 && (
            <span className="text-xs font-medium text-amber-600">
              Only {stock} left!
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          size="lg"
          disabled={isOutOfStock || isPending}
          onClick={handleAddToCart}
          className="flex-1 gap-2"
        >
          <ShoppingCart className="size-4" />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          disabled={isOutOfStock || isPending}
          onClick={handleBuyNow}
          className="flex-1 gap-2"
        >
          <Zap className="size-4 text-amber-500 fill-amber-500" />
          Buy Now
        </Button>
      </div>
    </div>
  );
}
