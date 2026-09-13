export interface CartLine {
  productId: string;
  variantId: string | null;
  quantity: number;
}

export const CART_STORAGE_KEY = "talbeena:cart";
export const CART_CHANGED_EVENT = "talbeena:cart-changed";

/** Read the guest cart from localStorage (thrown in non-browser contexts). */
export function readGuestCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is CartLine =>
        typeof l === "object" &&
        l !== null &&
        typeof l.productId === "string" &&
        typeof l.quantity === "number",
    );
  } catch {
    return [];
  }
}

/** Persist the guest cart and notify listeners. */
export function writeGuestCart(lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}

export function countCartLines(lines: CartLine[]): number {
  return lines.reduce((acc, l) => acc + l.quantity, 0);
}

/**
 * Deep-merge two carts keyed by product+variant. Quantities simply override
 * for the same key; new lines from `incoming` are appended.
 */
export function mergeCartLines(
  base: CartLine[],
  incoming: CartLine[],
): CartLine[] {
  const map = new Map<string, CartLine>();
  for (const line of base) {
    map.set(`${line.productId}:${line.variantId ?? ""}`, line);
  }
  for (const line of incoming) {
    const key = `${line.productId}:${line.variantId ?? ""}`;
    const existing = map.get(key);
    map.set(key, existing ? { ...existing, quantity: line.quantity } : line);
  }
  return Array.from(map.values());
}