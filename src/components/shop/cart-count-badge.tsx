"use client";

import { useEffect, useState } from "react";

import {
  CART_CHANGED_EVENT,
  countCartLines,
  readGuestCart,
} from "@/lib/cart-storage";
import { cn } from "@/lib/utils";

interface CartCountBadgeProps {
  className?: string;
}

/**
 * Displays the number of items in the guest cart. Listens for `storage`
 * events and the app's custom `CART_CHANGED_EVENT` so the icon stays in sync
 * while the cart is edited in other tabs/components.
 */
export function CartCountBadge({ className }: CartCountBadgeProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(countCartLines(readGuestCart()));
    update();
    window.addEventListener("storage", update);
    window.addEventListener(CART_CHANGED_EVENT, update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener(CART_CHANGED_EVENT, update);
    };
  }, []);

  if (count === 0) return null;

  return (
    <span
      className={cn(
        "absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background shadow-xs",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}