import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyWebhookSignature } from "@/lib/razorpay/utils";
import type { Order, OrderItem, Payment } from "@/types/firebase";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const db = getAdminDb();
    const now = Date.now();

    if (event === "payment.captured") {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        // Find payment by razorpayOrderId
        const paymentsSnap = await db
          .ref("payments")
          .orderByChild("razorpayOrderId")
          .equalTo(razorpayOrderId)
          .get();

        if (paymentsSnap.exists()) {
          const raw = paymentsSnap.val() as Record<string, Payment>;
          const [paymentId, payment] = Object.entries(raw)[0];

          await db.ref(`payments/${paymentId}`).update({
            razorpayPaymentId,
            status: "PAID",
            updatedAt: now,
          });

          // Confirm order
          await db.ref(`orders/${payment.orderId}`).update({
            status: "CONFIRMED",
            updatedAt: now,
          });
        }
      }
    } else if (event === "payment.failed") {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;

      if (razorpayOrderId) {
        const paymentsSnap = await db
          .ref("payments")
          .orderByChild("razorpayOrderId")
          .equalTo(razorpayOrderId)
          .get();

        if (paymentsSnap.exists()) {
          const raw = paymentsSnap.val() as Record<string, Payment>;
          const [paymentId, payment] = Object.entries(raw)[0];

          await db.ref(`payments/${paymentId}`).update({
            status: "FAILED",
            updatedAt: now,
          });

          // Mark order FAILED and restore stock
          const orderSnap = await db.ref(`orders/${payment.orderId}`).get();
          const order = orderSnap.val() as Order | null;

          if (order && order.status !== "FAILED" && order.status !== "CANCELLED") {
            await db.ref(`orders/${payment.orderId}`).update({
              status: "FAILED",
              updatedAt: now,
            });

            // Restore stock
            const itemsSnap = await db.ref(`orderItems/${payment.orderId}`).get();
            const items = (itemsSnap.val() ?? {}) as Record<string, OrderItem>;
            for (const item of Object.values(items)) {
              await db
                .ref(`products/${item.productId}/stock`)
                .transaction((s) => (typeof s === "number" ? s + item.quantity : item.quantity));
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
