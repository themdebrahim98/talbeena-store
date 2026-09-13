"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/server";
import { reviewSchema, type ReviewInput } from "@/validations/review";
import type { ProductReview, Order, OrderItem, UserProfile } from "@/types/firebase";

export async function submitProductReviewAction(
  productId: string,
  input: ReviewInput,
): Promise<{ success: boolean; error?: string; reviewId?: string }> {
  try {
    const session = await getSessionUser();
    if (!session) {
      return { success: false, error: "Please sign in to write a review." };
    }

    const parsed = reviewSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid review details.",
      };
    }

    if (!isAdminConfigured()) {
      return { success: false, error: "Database not configured." };
    }

    const db = getAdminDb();

    // 1. Fetch user profile for display name
    const userSnap = await db.ref(`users/${session.uid}`).get();
    const userProfile = userSnap.val() as UserProfile | null;
    const userName = userProfile?.fullName?.trim() || session.email.split("@")[0] || "Shopper";

    // 2. Check if verified buyer (has customer bought this product in a CONFIRMED or DELIVERED order?)
    let isVerifiedPurchase = false;
    const userOrdersSnap = await db
      .ref("orders")
      .orderByChild("userId")
      .equalTo(session.uid)
      .get();

    if (userOrdersSnap.exists()) {
      const orders = userOrdersSnap.val() as Record<string, Order>;
      for (const [orderId, order] of Object.entries(orders)) {
        if (order.status === "DELIVERED" || order.status === "CONFIRMED") {
          const itemsSnap = await db.ref(`orderItems/${orderId}`).get();
          const items = (itemsSnap.val() ?? {}) as Record<string, OrderItem>;
          if (Object.values(items).some((it) => it.productId === productId)) {
            isVerifiedPurchase = true;
            break;
          }
        }
      }
    }

    const now = Date.now();
    let reviewId: string | null = null;
    let originalCreatedAt = now;

    // Check if user already reviewed this product; update existing if found
    const reviewsRef = db.ref(`reviews/${productId}`);
    const existingSnap = await reviewsRef.get();
    if (existingSnap.exists()) {
      const existingReviews = existingSnap.val() as Record<string, ProductReview>;
      const existingEntry = Object.entries(existingReviews).find(
        ([, r]) => r.userId === session.uid,
      );
      if (existingEntry) {
        reviewId = existingEntry[0];
        originalCreatedAt = existingEntry[1].createdAt || now;
      }
    }

    const targetRef = reviewId ? reviewsRef.child(reviewId) : reviewsRef.push();
    const finalReviewId = reviewId || targetRef.key!;

    const review: ProductReview = {
      id: finalReviewId,
      productId,
      userId: session.uid,
      userName,
      rating: parsed.data.rating,
      title: parsed.data.title,
      comment: parsed.data.comment,
      isVerifiedPurchase,
      status: "APPROVED",
      createdAt: originalCreatedAt,
      updatedAt: now,
    };

    await targetRef.set(review);

    try {
      revalidatePath(`/products/${productId}`);
      revalidatePath("/products");
      revalidatePath("/account/orders");
      revalidatePath("/account");
    } catch {
      // Ignored outside Next.js request context
    }

    return { success: true, reviewId: finalReviewId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to submit review.";
    return { success: false, error: msg };
  }
}

export async function deleteProductReviewAction(
  productId: string,
  reviewId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSessionUser();
    if (!session) {
      return { success: false, error: "Authentication required." };
    }

    if (!isAdminConfigured()) {
      return { success: false, error: "Database not configured." };
    }

    const db = getAdminDb();
    const reviewRef = db.ref(`reviews/${productId}/${reviewId}`);
    const snap = await reviewRef.get();
    const review = snap.val() as ProductReview | null;

    if (!review) {
      return { success: false, error: "Review not found." };
    }

    if (review.userId !== session.uid && !session.isAdmin) {
      return { success: false, error: "You are not authorized to delete this review." };
    }

    await reviewRef.remove();

    try {
      revalidatePath(`/products/${productId}`);
      revalidatePath("/products");
    } catch {
      // Ignored outside Next.js request context
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete review.";
    return { success: false, error: msg };
  }
}
