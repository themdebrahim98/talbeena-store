import { describe, expect, it } from "vitest";

import {
  computeSubtotal,
  discountPercent,
  lineTotal,
  roundMoney,
  savingsPerUnit,
} from "@/lib/pricing";

describe("pricing", () => {
  it("rounds to paise", () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(10.004)).toBe(10.0);
  });

  it("computes line and subtotal totals with proper rounding", () => {
    expect(lineTotal({ quantity: 3, unitPrice: 199.5 })).toBe(598.5);
    expect(
      computeSubtotal([
        { quantity: 2, unitPrice: 199.99 },
        { quantity: 1, unitPrice: 49.5 },
      ]),
    ).toBe(449.48);
  });

  it("computes discount percent and per-unit savings", () => {
    expect(discountPercent(399, 499)).toBe(20);
    expect(discountPercent(499, 399)).toBeNull();
    expect(discountPercent(399, null)).toBeNull();
    expect(savingsPerUnit(399, 499)).toBe(100);
    expect(savingsPerUnit(499, null)).toBe(0);
  });
});