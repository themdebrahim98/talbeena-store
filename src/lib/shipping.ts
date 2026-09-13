import { businessConfig, type BusinessConfig } from "@/config/business";

import { roundMoney } from "@/lib/pricing";

export type ShippingConfig = BusinessConfig["shipping"];

/** Free shipping threshold and the flat fee below it. */
export const SHIPPING_CONFIG: ShippingConfig = businessConfig.shipping;

/**
 * Simple shipping model: free above a threshold, otherwise a flat fee.
 * All values come from the central business config — never hardcoded.
 */
export function computeShipping(
  subtotal: number,
  config: ShippingConfig = SHIPPING_CONFIG,
): number {
  const safeSubtotal = Math.max(0, subtotal);
  if (safeSubtotal >= config.freeShippingAbove) return 0;
  return config.flatShippingCharge;
}

export function isFreeShippingEligible(
  subtotal: number,
  config: ShippingConfig = SHIPPING_CONFIG,
): boolean {
  return Math.max(0, subtotal) >= config.freeShippingAbove;
}

/** Amount still needed for free shipping (0 when already eligible). */
export function remainingForFreeShipping(
  subtotal: number,
  config: ShippingConfig = SHIPPING_CONFIG,
): number {
  const remaining = config.freeShippingAbove - subtotal;
  return roundMoney(remaining > 0 ? remaining : 0);
}