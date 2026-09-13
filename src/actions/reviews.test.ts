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
import { submitProductReviewAction, deleteProductReviewAction } from "./reviews";
import {
  getProductReviews,
  checkCustomerPurchasedProduct,
  getUserProductReviews,
} from "@/queries/shop";
import type { Order, OrderItem } from "@/types/firebase";

describe("Product Reviews & Ratings System", () => {
  const testProductId = "test-isolated-review-product";
  const testUserId = "test-review-shopper-uid";

  it("rejects unauthenticated review submission", async () => {
    mockSessionUser = null;
    const res = await submitProductReviewAction(testProductId, {
      rating: 5,
      title: "Great Product",
      comment: "Loved the quality and taste.",
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/sign in/i);
  });

  it("validates review inputs", async () => {
    mockSessionUser = { uid: testUserId, email: "shopper@talbeena.in", isAdmin: false };
    // Rating out of range
    const res1 = await submitProductReviewAction(testProductId, {
      rating: 6,
      title: "Too high",
      comment: "Detailed review here.",
    });
    expect(res1.success).toBe(false);

    // Title too short
    const res2 = await submitProductReviewAction(testProductId, {
      rating: 4,
      title: "A",
      comment: "Valid details here.",
    });
    expect(res2.success).toBe(false);
  });

  it("allows customer to submit review, verifies purchase status, and calculates rating summary", async () => {
    if (!isAdminConfigured()) return;
    const db = getAdminDb();

    mockSessionUser = { uid: testUserId, email: "shopper@talbeena.in", isAdmin: false };

    // Set up a mock delivered order for this user to test verified buyer detection
    const testOrderId = `review-test-order-${Date.now()}`;
    const orderData: Order = {
      userId: testUserId,
      status: "DELIVERED",
      paymentMethod: "cod",
      addressName: "Test Reviewer",
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

    const orderItem: OrderItem = {
      productId: testProductId,
      variantId: null,
      productName: "Test Review Product",
      sku: "TEST-REV-SKU",
      unitPrice: 399,
      quantity: 1,
      total: 399,
      weight: 500,
    };
    await db.ref(`orderItems/${testOrderId}/item-1`).set(orderItem);

    // Check verified buyer helper
    const isPurchased = await checkCustomerPurchasedProduct(testUserId, testProductId);
    expect(isPurchased).toBe(true);

    // Submit review
    const submitRes = await submitProductReviewAction(testProductId, {
      rating: 5,
      title: "Wholesome & Fresh",
      comment: "Super smooth texture and great natural barley aroma. Loved it!",
    });
    expect(submitRes.success).toBe(true);
    expect(submitRes.reviewId).toBeDefined();

    // Query reviews
    const summary = await getProductReviews(testProductId);
    expect(summary.totalReviews).toBeGreaterThanOrEqual(1);
    expect(summary.averageRating).toBe(5);
    expect(summary.distribution[5]).toBeGreaterThanOrEqual(1);

    const submittedReview = summary.reviews.find((r) => r.id === submitRes.reviewId);
    expect(submittedReview).toBeDefined();
    expect(submittedReview?.isVerifiedPurchase).toBe(true);
    expect(submittedReview?.title).toBe("Wholesome & Fresh");

    // Test getUserProductReviews helper for delivered order items
    const userReviewsMap = await getUserProductReviews(testUserId, [testProductId]);
    expect(userReviewsMap[testProductId]).toBeDefined();
    expect(userReviewsMap[testProductId].rating).toBe(5);

    // Test updating existing review by same user (upsert)
    const updateRes = await submitProductReviewAction(testProductId, {
      rating: 4,
      title: "Updated Review Headline",
      comment: "Updated feedback details for this product.",
    });
    expect(updateRes.success).toBe(true);
    expect(updateRes.reviewId).toBe(submitRes.reviewId); // Reused reviewId

    const updatedSummary = await getProductReviews(testProductId);
    const updatedReview = updatedSummary.reviews.find((r) => r.id === submitRes.reviewId);
    expect(updatedReview?.rating).toBe(4);
    expect(updatedReview?.title).toBe("Updated Review Headline");

    // Test review deletion
    const deleteRes = await deleteProductReviewAction(testProductId, submitRes.reviewId!);
    expect(deleteRes.success).toBe(true);

    // Clean up
    await db.ref(`orders/${testOrderId}`).remove();
    await db.ref(`orderItems/${testOrderId}`).remove();
    await db.ref(`reviews/${testProductId}`).remove();
  });
});
