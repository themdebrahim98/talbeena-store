"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/server";
import { returnInputSchema, type ReturnInput } from "@/validations/return";
import type { Order } from "@/types/firebase";

export async function requestOrderReturnAction(
  orderId: string,
  input: ReturnInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSessionUser();
    if (!session) {
      return { success: false, error: "Please sign in to request a return." };
    }

    const parsed = returnInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid return request details.",
      };
    }

    if (!isAdminConfigured()) {
      return { success: false, error: "Database not configured." };
    }

    const db = getAdminDb();
    const orderSnap = await db.ref(`orders/${orderId}`).get();
    const order = orderSnap.val() as Order | null;

    if (!order) {
      return { success: false, error: "Order not found." };
    }

    // Ownership check
    if (order.userId !== session.uid && !session.isAdmin) {
      return { success: false, error: "You are not authorized to return this order." };
    }

    // Status check
    if (order.status !== "DELIVERED") {
      return {
        success: false,
        error: "Returns can only be requested for delivered orders.",
      };
    }

    const now = Date.now();
    await db.ref(`orders/${orderId}`).update({
      status: "RETURN_REQUESTED",
      returnReason: parsed.data.reason,
      returnComments: parsed.data.comments?.trim() || null,
      returnRequestedAt: now,
      updatedAt: now,
    });

    try {
      revalidatePath("/account/orders");
      revalidatePath(`/account/orders/${orderId}`);
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderId}`);
    } catch {
      // Ignored outside Next.js request context
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to submit return request.";
    return { success: false, error: msg };
  }
}
