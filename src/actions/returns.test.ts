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
import { requestOrderReturnAction } from "./returns";
import {
  updateReturnReviewAction,
  processOrderRefundAction,
} from "./admin-orders";
import type { Order, OrderItem } from "@/types/firebase";

describe("Returns & Refunds System", () => {
  const testCustomerId = "customer-return-tester";
  const testOrderId = "test-return-order-999";

  it("rejects unauthenticated customer return requests", async () => {
    mockSessionUser = null;
    const res = await requestOrderReturnAction(testOrderId, {
      reason: "damaged",
      comments: "Broken seal",
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/sign in/i);
  });

  it("rejects return request if order is not in DELIVERED status", async () => {
    if (!isAdminConfigured()) return;
    const db = getAdminDb();

    mockSessionUser = {
      uid: testCustomerId,
      email: "cust@talbeena.in",
      isAdmin: false,
    };

    // Create a CONFIRMED order
    const orderData: Order = {
      userId: testCustomerId,
      status: "CONFIRMED",
      paymentMethod: "cod",
      addressName: "Tester",
      addressPhone: "9876543210",
      addressLine1: "123 Street",
      addressLine2: null,
      addressCity: "Delhi",
      addressState: "Delhi",
      addressPincode: "110001",
      addressCountry: "India",
      subtotal: 399,
      discount: 0,
      couponId: null,
      couponCode: null,
      shipping: 49,
      total: 448,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.ref(`orders/${testOrderId}`).set(orderData);

    const res = await requestOrderReturnAction(testOrderId, {
      reason: "wrong_item",
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/delivered/i);

    // Clean up
    await db.ref(`orders/${testOrderId}`).remove();
  });

  it("successfully allows customer to request return for DELIVERED order", async () => {
    if (!isAdminConfigured()) return;
    const db = getAdminDb();

    mockSessionUser = {
      uid: testCustomerId,
      email: "cust@talbeena.in",
      isAdmin: false,
    };

    const orderData: Order = {
      userId: testCustomerId,
      status: "DELIVERED",
      paymentMethod: "cod",
      addressName: "Tester",
      addressPhone: "9876543210",
      addressLine1: "123 Street",
      addressLine2: null,
      addressCity: "Delhi",
      addressState: "Delhi",
      addressPincode: "110001",
      addressCountry: "India",
      subtotal: 399,
      discount: 0,
      couponId: null,
      couponCode: null,
      shipping: 0,
      total: 399,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.ref(`orders/${testOrderId}`).set(orderData);

    const res = await requestOrderReturnAction(testOrderId, {
      reason: "damaged",
      comments: "Package arrived with damaged lid.",
    });
    expect(res.success).toBe(true);

    const snap = await db.ref(`orders/${testOrderId}`).get();
    const updated = snap.val() as Order;
    expect(updated.status).toBe("RETURN_REQUESTED");
    expect(updated.returnReason).toBe("damaged");
    expect(updated.returnComments).toBe("Package arrived with damaged lid.");
    expect(typeof updated.returnRequestedAt).toBe("number");

    // Clean up
    await db.ref(`orders/${testOrderId}`).remove();
  });

  it("allows admin to review return (approve/reject) and process refund with stock replenishment", async () => {
    if (!isAdminConfigured()) return;
    const db = getAdminDb();

    const isolatedProductSlug = "test-return-isolated-product";
    const baselineStock = 20;
    await db.ref(`products/${isolatedProductSlug}`).set({
      name: "Isolated Test Return Product",
      stock: baselineStock,
      price: 249,
    });

    // Create delivered order with orderItems
    const orderData: Order = {
      userId: testCustomerId,
      status: "RETURN_REQUESTED",
      paymentMethod: "cod",
      addressName: "Tester",
      addressPhone: "9876543210",
      addressLine1: "123 Street",
      addressLine2: null,
      addressCity: "Delhi",
      addressState: "Delhi",
      addressPincode: "110001",
      addressCountry: "India",
      subtotal: 249,
      discount: 0,
      couponId: null,
      couponCode: null,
      shipping: 49,
      total: 298,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      returnReason: "quality",
      returnComments: "Texture not as expected",
      returnRequestedAt: Date.now(),
    };
    await db.ref(`orders/${testOrderId}`).set(orderData);

    const orderItem: OrderItem = {
      productId: isolatedProductSlug,
      variantId: null,
      productName: "Isolated Test Return Product",
      sku: "TEST-RETURN-SKU",
      unitPrice: 249,
      quantity: 2,
      total: 498,
      weight: 1000,
    };
    await db.ref(`orderItems/${testOrderId}/item-1`).set(orderItem);

    // 1. Admin approves return
    mockSessionUser = {
      uid: "admin-staff-uid",
      email: "admin@talbeena.in",
      isAdmin: true,
    };

    const approveRes = await updateReturnReviewAction(
      testOrderId,
      "RETURN_APPROVED",
      "Pickup scheduled for tomorrow",
    );
    expect(approveRes.success).toBe(true);

    const approvedSnap = await db.ref(`orders/${testOrderId}`).get();
    expect(approvedSnap.val().status).toBe("RETURN_APPROVED");
    expect(approvedSnap.val().adminNotes).toBe("Pickup scheduled for tomorrow");

    // 2. Admin processes refund (with restoreStock: true)
    const refundRes = await processOrderRefundAction(testOrderId, {
      restoreStock: true,
      adminNotes: "Refund completed to customer account",
    });
    expect(refundRes.success).toBe(true);
    expect(refundRes.refundId).toBeDefined();

    // Verify order marked REFUNDED
    const refundedSnap = await db.ref(`orders/${testOrderId}`).get();
    const refundedOrder = refundedSnap.val() as Order;
    expect(refundedOrder.status).toBe("REFUNDED");
    expect(refundedOrder.refundAmount).toBe(298);
    expect(typeof refundedOrder.refundedAt).toBe("number");

    // Verify product stock was replenished (+2 items)
    const newStockSnap = await db.ref(`products/${isolatedProductSlug}/stock`).get();
    expect(newStockSnap.val()).toBe(baselineStock + 2);

    // Clean up
    await db.ref(`orders/${testOrderId}`).remove();
    await db.ref(`orderItems/${testOrderId}`).remove();
    await db.ref(`products/${isolatedProductSlug}`).remove();
  });
});
