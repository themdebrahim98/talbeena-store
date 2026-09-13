import { describe, expect, it } from "vitest";

import { computeCartTotals } from "@/lib/cart-totals";
import type { CouponRecord } from "@/lib/coupons";

const NOW = new Date("2026-01-15T00:00:00Z");

const coupon: CouponRecord = {
  id: "c1",
  code: "WELCOME10",
  type: "percentage",
  value: 10,
  min_order_amount: 0,
  max_discount: null,
  per_user_limit: 1,
  usage_limit: null,
  starts_at: null,
  expires_at: null,
  is_active: true,
};

const lines = [
  { quantity: 2, unitPrice: 399 },
  { quantity: 1, unitPrice: 199 },
];

describe("computeCartTotals", () => {
  it("sums subtotal, shipping and total with no coupon", () => {
    const totals = computeCartTotals({
      lines,
      now: NOW,
      shippingConfig: { freeShippingAbove: 500, flatShippingCharge: 49 },
    });
    expect(totals.subtotal).toBe(997);
    expect(totals.discount).toBe(0);
    expect(totals.shipping).toBe(0); // free above ₹500
    expect(totals.total).toBe(997);
  });

  it("charges shipping below the free threshold", () => {
    const totals = computeCartTotals({
      lines: [{ quantity: 1, unitPrice: 199 }],
      now: NOW,
      shippingConfig: { freeShippingAbove: 500, flatShippingCharge: 49 },
    });
    expect(totals.subtotal).toBe(199);
    expect(totals.shipping).toBe(49);
    expect(totals.total).toBe(248);
  });

  it("applies a valid coupon discount", () => {
    const totals = computeCartTotals({
      lines,
      coupon: { record: coupon, usage: { userUsage: 0, totalUsage: 0 } },
      now: NOW,
      shippingConfig: { freeShippingAbove: 500, flatShippingCharge: 49 },
    });
    expect(totals.discount).toBe(99.7);
    expect(totals.total).toBe(897.3);
  });

  it("ignores an invalid coupon entirely", () => {
    const totals = computeCartTotals({
      lines,
      coupon: { record: { ...coupon, is_active: false }, usage: { userUsage: 0, totalUsage: 0 } },
      now: NOW,
      shippingConfig: { freeShippingAbove: 500, flatShippingCharge: 49 },
    });
    expect(totals.couponEvaluation).toEqual({ valid: false, error: "INACTIVE" });
    expect(totals.discount).toBe(0);
    expect(totals.total).toBe(997);
  });
});