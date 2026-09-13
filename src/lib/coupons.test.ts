import { describe, expect, it } from "vitest";

import { evaluateCoupon, type CouponRecord } from "@/lib/coupons";

const NOW = new Date("2026-01-15T00:00:00Z");

function makeCoupon(overrides: Partial<CouponRecord> = {}): CouponRecord {
  return {
    id: "c1",
    code: "TEST10",
    type: "percentage",
    value: 10,
    min_order_amount: 0,
    max_discount: null,
    per_user_limit: 1,
    usage_limit: null,
    starts_at: null,
    expires_at: null,
    is_active: true,
    ...overrides,
  };
}

describe("coupons", () => {
  it("applies a percentage discount to the subtotal", () => {
    const result = evaluateCoupon(makeCoupon({ value: 10 }), 1000, { userUsage: 0, totalUsage: 0 }, NOW);
    expect(result).toEqual({ valid: true, discount: 100 });
  });

  it("applies a fixed discount", () => {
    const result = evaluateCoupon(makeCoupon({ type: "fixed", value: 150 }), 1000, { userUsage: 0, totalUsage: 0 }, NOW);
    expect(result).toEqual({ valid: true, discount: 150 });
  });

  it("caps a fixed discount at the subtotal", () => {
    const result = evaluateCoupon(makeCoupon({ type: "fixed", value: 999 }), 100, { userUsage: 0, totalUsage: 0 }, NOW);
    expect(result).toEqual({ valid: true, discount: 100 });
  });

  it("caps a percentage discount by max_discount", () => {
    const result = evaluateCoupon(makeCoupon({ value: 50, max_discount: 200 }), 1000, { userUsage: 0, totalUsage: 0 }, NOW);
    expect(result).toEqual({ valid: true, discount: 200 });
  });

  it("rejects inactive, not-started and expired coupons", () => {
    expect(evaluateCoupon(makeCoupon({ is_active: false }), 1000, { userUsage: 0, totalUsage: 0 }, NOW)).toEqual({ valid: false, error: "INACTIVE" });
    expect(evaluateCoupon(makeCoupon({ starts_at: "2026-02-01T00:00:00Z" }), 1000, { userUsage: 0, totalUsage: 0 }, NOW)).toEqual({ valid: false, error: "NOT_STARTED" });
    expect(evaluateCoupon(makeCoupon({ expires_at: "2026-01-01T00:00:00Z" }), 1000, { userUsage: 0, totalUsage: 0 }, NOW)).toEqual({ valid: false, error: "EXPIRED" });
  });

  it("enforces minimum order amount", () => {
    expect(evaluateCoupon(makeCoupon({ min_order_amount: 500 }), 300, { userUsage: 0, totalUsage: 0 }, NOW)).toEqual({ valid: false, error: "MIN_ORDER" });
  });

  it("enforces per-user and total usage limits", () => {
    expect(evaluateCoupon(makeCoupon({ per_user_limit: 2 }), 1000, { userUsage: 2, totalUsage: 0 }, NOW)).toEqual({ valid: false, error: "PER_USER_LIMIT" });
    expect(evaluateCoupon(makeCoupon({ usage_limit: 5 }), 1000, { userUsage: 0, totalUsage: 5 }, NOW)).toEqual({ valid: false, error: "USAGE_LIMIT" });
  });
});