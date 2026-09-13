import { describe, it, expect } from "vitest";
import { addressSchema } from "./address";

describe("Indian Address Validation Schema", () => {
  it("validates a complete, valid Indian shipping address", () => {
    const valid = {
      name: "Mohammad Ebrahim",
      phone: "9876543210",
      line1: "Flat 401, Al-Noor Heights, Hill Road",
      line2: "Near Bandra Station",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
      country: "India",
      isDefault: true,
    };

    const parsed = addressSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("rejects phone numbers with invalid Indian format", () => {
    const invalidPhone = {
      name: "Mohammad Ebrahim",
      phone: "1234567890", // doesn't start with 6, 7, 8, 9
      line1: "Flat 401, Al-Noor Heights",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
    };

    const parsed = addressSchema.safeParse(invalidPhone);
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid pincodes", () => {
    const invalidPin = {
      name: "Mohammad Ebrahim",
      phone: "9876543210",
      line1: "Flat 401, Al-Noor Heights",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "40005", // only 5 digits
    };

    const parsed = addressSchema.safeParse(invalidPin);
    expect(parsed.success).toBe(false);
  });
});
