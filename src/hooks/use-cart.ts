"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CART_CHANGED_EVENT,
  countCartLines,
  readGuestCart,
  writeGuestCart,
  type CartLine,
} from "@/lib/cart-storage";
import { toast } from "@/components/primitives/toast";

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const sync = () => {
      setLines(readGuestCart());
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(CART_CHANGED_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CART_CHANGED_EVENT, sync);
    };
  }, []);

  const addItem = (
    productId: string,
    variantId: string | null = null,
    quantity = 1,
    productName = "Item",
  ) => {
    startTransition(() => {
      const current = readGuestCart();
      const existingIndex = current.findIndex(
        (l) => l.productId === productId && l.variantId === variantId,
      );

      let updated: CartLine[];
      if (existingIndex >= 0) {
        updated = current.map((l, i) =>
          i === existingIndex ? { ...l, quantity: l.quantity + quantity } : l,
        );
      } else {
        updated = [...current, { productId, variantId, quantity }];
      }

      writeGuestCart(updated);
      setLines(updated);
      toast.success(`${productName} added to cart`);
    });
  };

  const updateQuantity = (
    productId: string,
    variantId: string | null,
    quantity: number,
  ) => {
    startTransition(() => {
      const current = readGuestCart();
      if (quantity <= 0) {
        const filtered = current.filter(
          (l) => !(l.productId === productId && l.variantId === variantId),
        );
        writeGuestCart(filtered);
        setLines(filtered);
      } else {
        const updated = current.map((l) =>
          l.productId === productId && l.variantId === variantId
            ? { ...l, quantity }
            : l,
        );
        writeGuestCart(updated);
        setLines(updated);
      }
    });
  };

  const removeItem = (productId: string, variantId: string | null = null) => {
    startTransition(() => {
      const current = readGuestCart();
      const filtered = current.filter(
        (l) => !(l.productId === productId && l.variantId === variantId),
      );
      writeGuestCart(filtered);
      setLines(filtered);
      toast.info("Item removed from cart");
    });
  };

  const clearCart = () => {
    startTransition(() => {
      writeGuestCart([]);
      setLines([]);
    });
  };

  return {
    lines,
    count: countCartLines(lines),
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    isPending,
  };
}
