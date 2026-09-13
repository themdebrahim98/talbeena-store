import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, beforeAll, vi } from "vitest";

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
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
});

let mockSessionUser: { uid: string; email: string; isAdmin: boolean } | null = null;

vi.mock("@/lib/firebase/server", () => ({
  getSessionUser: vi.fn(async () => mockSessionUser),
}));

vi.mock("@/queries/admin", () => ({
  requireAdmin: vi.fn(async () => {
    if (!mockSessionUser?.isAdmin) {
      throw new Error("Admin access required");
    }
    return mockSessionUser;
  }),
}));

import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { updateOrderShipmentAction } from "./admin-orders";
import type { Order } from "@/types/firebase";

describe("Order Shipment & Logistics Tracking", () => {
  const testOrderId = "test-shipment-order-123";

  it("rejects shipment update for non-admin callers", async () => {
    mockSessionUser = { uid: "customer-123", email: "user@talbeena.in", isAdmin: false };
    const res = await updateOrderShipmentAction(testOrderId, {
      carrier: "Delhivery",
      trackingNumber: "DLH123456789",
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/admin/i);
  });

  it("validates required shipment inputs", async () => {
    mockSessionUser = { uid: "admin-uid", email: "admin@talbeena.in", isAdmin: true };
    const res1 = await updateOrderShipmentAction(testOrderId, {
      carrier: "",
      trackingNumber: "123456",
    });
    expect(res1.success).toBe(false);

    const res2 = await updateOrderShipmentAction(testOrderId, {
      carrier: "Delhivery",
      trackingNumber: "12", // too short
    });
    expect(res2.success).toBe(false);
  });

  it("updates courier, tracking number, auto-generates tracking URL, and sets status to SHIPPED", async () => {
    if (!isAdminConfigured()) return;
    const db = getAdminDb();

    mockSessionUser = { uid: "admin-uid", email: "admin@talbeena.in", isAdmin: true };

    // Create baseline test order
    const orderData: Order = {
      userId: "test-user-shipment",
      status: "CONFIRMED",
      paymentMethod: "cod",
      addressName: "Shipment Tester",
      addressPhone: "9876543210",
      addressLine1: "45 Hill Road",
      addressLine2: null,
      addressCity: "Bengaluru",
      addressState: "Karnataka",
      addressPincode: "560001",
      addressCountry: "India",
      subtotal: 450,
      discount: 0,
      couponId: null,
      couponCode: null,
      shipping: 0,
      total: 450,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.ref(`orders/${testOrderId}`).set(orderData);

    // Call updateOrderShipmentAction with Delhivery
    const res = await updateOrderShipmentAction(testOrderId, {
      carrier: "Delhivery",
      trackingNumber: "140998877665",
      estimatedDeliveryDays: 4,
    });
    expect(res.success).toBe(true);

    // Verify in RTDB
    const snap = await db.ref(`orders/${testOrderId}`).get();
    const updated = snap.val() as Order;
    expect(updated.status).toBe("SHIPPED");
    expect(updated.carrier).toBe("Delhivery");
    expect(updated.trackingNumber).toBe("140998877665");
    expect(updated.trackingUrl).toContain("delhivery.com/track/package/140998877665");
    expect(typeof updated.shippedAt).toBe("number");
    expect(typeof updated.estimatedDeliveryAt).toBe("number");

    // Clean up
    await db.ref(`orders/${testOrderId}`).remove();
  });
});
