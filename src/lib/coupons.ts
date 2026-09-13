import { roundMoney } from "@/lib/pricing";

export type CouponType = "percentage" | "fixed";

/** Shape of a coupon loaded from the `coupons` table. */
export interface CouponRecord {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order_amount: number;
  max_discount: number | null;
  per_user_limit: number;
  usage_limit: number | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

export interface CouponUsageSnapshot {
  /** Number of times this user has already used the coupon. */
  userUsage: number;
  /** Total number of uses across everyone. */
  totalUsage: number;
}

export type CouponError =
  | "INVALID"
  | "INACTIVE"
  | "NOT_STARTED"
  | "EXPIRED"
  | "MIN_ORDER"
  | "PER_USER_LIMIT"
  | "USAGE_LIMIT";

export type CouponEvaluation =
  | { valid: true; discount: number }
  | { valid: false; error: CouponError };

/**
 * Pure coupon evaluator. The server passes database values (never user input)
 * plus a usage snapshot; the client should never be trusted to apply coupons.
 */
export function evaluateCoupon(
  coupon: CouponRecord,
  subtotal: number,
  usage: CouponUsageSnapshot,
  now: Date = new Date(),
): CouponEvaluation {
  if (!coupon.is_active) return { valid: false, error: "INACTIVE" };

  const start = coupon.starts_at ? new Date(coupon.starts_at) : null;
  const end = coupon.expires_at ? new Date(coupon.expires_at) : null;

  if (start && now < start) return { valid: false, error: "NOT_STARTED" };
  if (end && now > end) return { valid: false, error: "EXPIRED" };

  if (subtotal < coupon.min_order_amount) {
    return { valid: false, error: "MIN_ORDER" };
  }

  if (coupon.usage_limit !== null && usage.totalUsage >= coupon.usage_limit) {
    return { valid: false, error: "USAGE_LIMIT" };
  }

  if (usage.userUsage >= coupon.per_user_limit) {
    return { valid: false, error: "PER_USER_LIMIT" };
  }

  let discount: number;
  if (coupon.type === "percentage") {
    discount = roundMoney(subtotal * (coupon.value / 100));
  } else {
    discount = roundMoney(Math.min(coupon.value, subtotal));
  }

  if (coupon.max_discount !== null) {
    discount = Math.min(discount, roundMoney(coupon.max_discount));
  }

  discount = Math.max(0, discount);

  if (discount <= 0) return { valid: false, error: "MIN_ORDER" };

  return { valid: true, discount };
}

export const COUPON_ERROR_MESSAGES: Record<CouponError, string> = {
  INVALID: "This coupon code is invalid.",
  INACTIVE: "This coupon is no longer active.",
  NOT_STARTED: "This coupon is not active yet.",
  EXPIRED: "This coupon has expired.",
  MIN_ORDER: "Add more items to use this coupon.",
  PER_USER_LIMIT: "You have already used this coupon.",
  USAGE_LIMIT: "This coupon has reached its usage limit.",
};