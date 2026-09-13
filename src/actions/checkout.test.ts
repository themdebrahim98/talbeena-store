import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
});

import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { createOrderAction } from "./checkout";

describe("Checkout createOrderAction", () => {
  it("successfully places an order and decrements stock without aborting on null cache", async () => {
    if (!isAdminConfigured()) {
      console.warn("Firebase Admin not configured for test environment, skipping live DB test.");
      return;
    }

    const db = getAdminDb();
    const stockSnap = await db.ref("products/stone-ground-barley-flour/stock").get();
    const initialStock = stockSnap.val() as number;
    expect(typeof initialStock).toBe("number");

    const result = await createOrderAction({
      items: [{ productId: "stone-ground-barley-flour", variantId: null, quantity: 1 }],
      address: {
        name: "Test Shopper",
        phone: "9876543210",
        line1: "123 Orchard Lane",
        line2: null,
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        country: "India",
        isDefault: false,
        createdAt: Date.now(),
      },
      paymentMethod: "cod",
    });

    if (!result.success) {
      console.error("createOrderAction failed with:", result.error);
    }
    expect(result.success).toBe(true);
    expect(result.orderId).toBeDefined();

    // Verify stock was decremented
    const updatedStockSnap = await db.ref("products/stone-ground-barley-flour/stock").get();
    expect(updatedStockSnap.val()).toBe(initialStock - 1);

    // Clean up created test order and restore stock
    if (result.orderId) {
      await db.ref(`orders/${result.orderId}`).remove();
      await db.ref(`orderItems/${result.orderId}`).remove();
      await db.ref("products/stone-ground-barley-flour/stock").set(initialStock);
    }
  });
});
