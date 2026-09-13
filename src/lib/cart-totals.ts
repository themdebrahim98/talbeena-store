import { computeSubtotal, roundMoney, type PricedLine } from "@/lib/pricing";
import { computeShipping, type ShippingConfig } from "@/lib/shipping";
import {
  evaluateCoupon,
  type CouponEvaluation,
  type CouponRecord,
  type CouponUsageSnapshot,
} from "@/lib/coupons";

export interface CartTotalsInput {
  lines: PricedLine[];
  coupon?: { record: CouponRecord; usage: CouponUsageSnapshot } | null;
  now?: Date;
  shippingConfig?: ShippingConfig;
}

export interface CartTotals {
  subtotal: number;
  couponEvaluation: CouponEvaluation;
  discount: number;
  shipping: number;
  /** Final payable amount. */
  total: number;
}

/**
 * Single source of truth for what the customer pays. Prices, the coupon and
 * the shipping rule are all server data; this function performs no I/O.
 */
export function computeCartTotals({
  lines,
  coupon,
  now,
  shippingConfig,
}: CartTotalsInput): CartTotals {
  const subtotal = computeSubtotal(lines);

  const couponEvaluation = coupon
    ? evaluateCoupon(coupon.record, subtotal, coupon.usage, now)
    : { valid: true as const, discount: 0 };

  const discount = couponEvaluation.valid ? couponEvaluation.discount : 0;
  const shipping = computeShipping(subtotal, shippingConfig);

  const total = roundMoney(subtotal - discount + shipping);

  return {
    subtotal,
    couponEvaluation,
    discount,
    shipping,
    total,
  };
}