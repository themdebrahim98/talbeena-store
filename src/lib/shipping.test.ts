import { describe, expect, it } from "vitest";

import {
  SHIPPING_CONFIG,
  computeShipping,
  isFreeShippingEligible,
  remainingForFreeShipping,
} from "@/lib/shipping";

describe("shipping", () => {
  it("charges flat fee below the threshold", () => {
    expect(computeShipping(0)).toBe(SHIPPING_CONFIG.flatShippingCharge);
    expect(computeShipping(499, { freeShippingAbove: 500, flatShippingCharge: 49 })).toBe(49);
  });

  it("is free at and above the threshold", () => {
    expect(computeShipping(500, { freeShippingAbove: 500, flatShippingCharge: 49 })).toBe(0);
    expect(computeShipping(1500, { freeShippingAbove: 500, flatShippingCharge: 49 })).toBe(0);
  });

  it("reports eligibility and the remaining amount", () => {
    expect(isFreeShippingEligible(400, { freeShippingAbove: 500, flatShippingCharge: 49 })).toBe(false);
    expect(isFreeShippingEligible(500, { freeShippingAbove: 500, flatShippingCharge: 49 })).toBe(true);
    expect(remainingForFreeShipping(400, { freeShippingAbove: 500, flatShippingCharge: 49 })).toBe(100);
    expect(remainingForFreeShipping(600, { freeShippingAbove: 500, flatShippingCharge: 49 })).toBe(0);
  });

  it("clamps negative subtotals", () => {
    expect(computeShipping(-10, { freeShippingAbove: 500, flatShippingCharge: 49 })).toBe(49);
  });
});