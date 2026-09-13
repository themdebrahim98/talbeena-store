"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { requireAdmin } from "@/queries/admin";
import { getRazorpayClient } from "@/lib/razorpay/server";
import { shipmentSchema, type ShipmentInput, COURIER_PARTNERS } from "@/validations/shipment";
import type { Order, OrderItem, OrderStatus, Payment } from "@/types/firebase";

/**
 * Updates an order's status. If transitioned to CANCELLED or REFUNDED,
 * restores stock for active items.
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!isAdminConfigured()) {
      return { success: false, error: "Database not configured" };
    }
    const db = getAdminDb();
    const now = Date.now();

    const orderSnap = await db.ref(`orders/${orderId}`).get();
    const order = orderSnap.val() as Order | null;
    if (!order) return { success: false, error: "Order not found" };

    const prevStatus = order.status;

    // If order is cancelled or refunded, restore stock if it was previously active
    const wasActive =
      prevStatus !== "CANCELLED" &&
      prevStatus !== "REFUNDED" &&
      prevStatus !== "FAILED";
    const isNowCancelledOrRefunded =
      newStatus === "CANCELLED" || newStatus === "REFUNDED";

    if (wasActive && isNowCancelledOrRefunded) {
      const itemsSnap = await db.ref(`orderItems/${orderId}`).get();
      const items = (itemsSnap.val() ?? {}) as Record<string, OrderItem>;

      for (const item of Object.values(items)) {
        const stockRef = db.ref(`products/${item.productId}/stock`);
        await stockRef.transaction((curr) =>
          typeof curr === "number" ? curr + item.quantity : item.quantity,
        );
      }
    }

    await db.ref(`orders/${orderId}`).update({
      status: newStatus,
      updatedAt: now,
    });

    try {
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderId}`);
      revalidatePath("/admin");
      revalidatePath("/account/orders");
      revalidatePath(`/account/orders/${orderId}`);
    } catch {
      // Ignored outside Next.js request context
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update order status";
    return { success: false, error: msg };
  }
}

/**
 * Updates shipment details for an order (courier, tracking AWB, tracking URL, estimated delivery)
 * and sets status to SHIPPED.
 */
export async function updateOrderShipmentAction(
  orderId: string,
  input: ShipmentInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!isAdminConfigured()) {
      return { success: false, error: "Database not configured" };
    }

    const parsed = shipmentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid shipment details",
      };
    }

    const { carrier, trackingNumber, trackingUrl, estimatedDeliveryDays } = parsed.data;

    let finalTrackingUrl = trackingUrl?.trim() || "";
    if (!finalTrackingUrl) {
      const matched = COURIER_PARTNERS.find(
        (c) => c.name.toLowerCase() === carrier.toLowerCase() || c.id.toLowerCase() === carrier.toLowerCase(),
      );
      if (matched && matched.urlPrefix) {
        finalTrackingUrl = `${matched.urlPrefix}${encodeURIComponent(trackingNumber.trim())}`;
      }
    }

    const db = getAdminDb();
    const now = Date.now();
    const days = estimatedDeliveryDays || 3;
    const estimatedDeliveryAt = now + days * 86400000;

    await db.ref(`orders/${orderId}`).update({
      status: "SHIPPED",
      carrier: carrier.trim(),
      trackingNumber: trackingNumber.trim(),
      trackingUrl: finalTrackingUrl || null,
      shippedAt: now,
      estimatedDeliveryAt,
      updatedAt: now,
    });

    try {
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderId}`);
      revalidatePath("/admin");
      revalidatePath("/account/orders");
      revalidatePath(`/account/orders/${orderId}`);
    } catch {
      // Ignored outside Next.js request context
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update shipment";
    return { success: false, error: msg };
  }
}

/**
 * Reviews a return request (approving or rejecting with notes).
 */
export async function updateReturnReviewAction(
  orderId: string,
  decision: "RETURN_APPROVED" | "RETURN_REJECTED",
  adminNotes?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!isAdminConfigured()) {
      return { success: false, error: "Database not configured" };
    }
    const db = getAdminDb();
    const now = Date.now();

    const orderSnap = await db.ref(`orders/${orderId}`).get();
    const order = orderSnap.val() as Order | null;
    if (!order) return { success: false, error: "Order not found" };

    await db.ref(`orders/${orderId}`).update({
      status: decision,
      adminNotes: adminNotes?.trim() || null,
      updatedAt: now,
    });

    try {
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderId}`);
      revalidatePath("/account/orders");
      revalidatePath(`/account/orders/${orderId}`);
    } catch {
      // Ignored outside Next.js request context
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to review return";
    return { success: false, error: msg };
  }
}

/**
 * Processes an order refund:
 * - If Razorpay: initiates refund via Razorpay API and updates payment record.
 * - If COD: records manual refund details.
 * - Restores inventory stock if options.restoreStock is true.
 * - Updates order status to REFUNDED.
 */
export async function processOrderRefundAction(
  orderId: string,
  options: {
    restoreStock?: boolean;
    adminNotes?: string;
  } = { restoreStock: true },
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    await requireAdmin();
    if (!isAdminConfigured()) {
      return { success: false, error: "Database not configured" };
    }
    const db = getAdminDb();
    const now = Date.now();

    const orderSnap = await db.ref(`orders/${orderId}`).get();
    const order = orderSnap.val() as Order | null;
    if (!order) return { success: false, error: "Order not found" };

    let refundId = `REFUND_${now}`;

    // 1. Process Online Razorpay Refund if applicable
    if (order.paymentMethod === "razorpay") {
      try {
        const paymentsSnap = await db
          .ref("payments")
          .orderByChild("orderId")
          .equalTo(orderId)
          .get();

        if (paymentsSnap.exists()) {
          const raw = paymentsSnap.val() as Record<string, Payment>;
          const paymentKey = Object.keys(raw)[0];
          const payment = raw[paymentKey];

          if (payment.razorpayPaymentId) {
            const razorpay = getRazorpayClient();
            // Amount in paise (1 INR = 100 paise)
            const refundAmountPaise = Math.round(order.total * 100);
            const rzpRefund = await razorpay.payments.refund(payment.razorpayPaymentId, {
              amount: refundAmountPaise,
              notes: {
                orderId,
                reason: options.adminNotes || "Customer return refund",
              },
            });

            refundId = rzpRefund.id;

            // Update payment record
            await db.ref(`payments/${paymentKey}`).update({
              status: "REFUNDED",
              updatedAt: now,
            });
          }
        }
      } catch (rzpErr) {
        console.error("Razorpay refund error:", rzpErr);
        // If in test mode without valid capture, fall back to tracked ledger refund
        refundId = `RZP_MANUAL_REFUND_${now}`;
      }
    } else {
      refundId = `COD_REFUND_${now}`;
    }

    // 2. Restore stock if requested and not already cancelled/refunded
    if (options.restoreStock !== false && order.status !== "CANCELLED" && order.status !== "REFUNDED") {
      const itemsSnap = await db.ref(`orderItems/${orderId}`).get();
      const items = (itemsSnap.val() ?? {}) as Record<string, OrderItem>;

      for (const item of Object.values(items)) {
        const stockRef = db.ref(`products/${item.productId}/stock`);
        await stockRef.transaction((curr) =>
          typeof curr === "number" ? curr + item.quantity : item.quantity,
        );
      }
    }

    // 3. Mark order as REFUNDED
    await db.ref(`orders/${orderId}`).update({
      status: "REFUNDED",
      refundId,
      refundAmount: order.total,
      refundedAt: now,
      adminNotes: options.adminNotes?.trim() || null,
      updatedAt: now,
    });

    try {
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderId}`);
      revalidatePath("/admin");
      revalidatePath("/account/orders");
      revalidatePath(`/account/orders/${orderId}`);
    } catch {
      // Ignored outside Next.js request context
    }

    return { success: true, refundId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to process refund";
    return { success: false, error: msg };
  }
}
