"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { Button } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  productName?: string;
  className?: string;
  variant?: "icon" | "full";
}

export function WishlistButton({
  productId,
  productName = "Product",
  className,
  variant = "icon",
}: WishlistButtonProps) {
  const { isWishlisted, toggleWishlist, isPending } = useWishlist();
  const active = isWishlisted(productId);

  if (variant === "full") {
    return (
      <Button
        variant={active ? "secondary" : "outline"}
        size="lg"
        disabled={isPending}
        onClick={() => toggleWishlist(productId, productName)}
        className={cn("gap-2", active && "text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100", className)}
      >
        <Heart
          className={cn(
            "size-4 transition-transform active:scale-125",
            active ? "fill-rose-600 text-rose-600" : "text-muted-foreground",
          )}
        />
        {active ? "In Wishlist" : "Add to Wishlist"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(productId, productName);
      }}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-background/80 backdrop-blur border shadow-xs transition hover:scale-105 active:scale-95",
        active
          ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-4 transition-transform",
          active ? "fill-rose-600 text-rose-600" : "text-muted-foreground",
        )}
      />
    </button>
  );
}
