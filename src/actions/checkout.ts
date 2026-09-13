"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/server";
import { computeCartTotals } from "@/lib/cart-totals";
import { couponToRecord } from "@/types/firebase";
import { getRazorpayClient } from "@/lib/razorpay/server";
import { verifyPaymentSignature } from "@/lib/razorpay/utils";
import type {
  Address,
  Coupon,
  Order,
  OrderItem,
  Payment,
  PaymentMethod,
  Product,
} from "@/types/firebase";

export interface CheckoutItemInput {
  productId: string;
  variantId: string | null;
  quantity: number;
}

export interface CreateOrderParams {
  items: CheckoutItemInput[];
  address: Address;
  paymentMethod: PaymentMethod;
  couponCode?: string | null;
  customerNote?: string | null;
}

export interface CreateOrderResult {
  success: boolean;
  error?: string;
  orderId?: string;
  paymentMethod?: PaymentMethod;
  razorpayOrderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
}

export async function createOrderAction(
  params: CreateOrderParams,
): Promise<CreateOrderResult> {
  try {
    const { items, address, paymentMethod, couponCode } = params;

    if (!items || items.length === 0) {
      return { success: false, error: "Your cart is empty." };
    }

    const session = await getSessionUser();
    const db = getAdminDb();
    const now = Date.now();

    // 1. Fetch live product details to lock in verified prices and stock
    const pricedLines: Array<{
      productId: string;
      variantId: string | null;
      productName: string;
      sku: string;
      unitPrice: number;
      quantity: number;
      weight: number;
    }> = [];

    for (const item of items) {
      const snap = await db.ref(`products/${item.productId}`).get();
      const product = snap.val() as Product | null;

      if (!product || !product.isActive) {
        return {
          success: false,
          error: `Product "${item.productId}" is no longer available.`,
        };
      }

      if (product.stock < item.quantity) {
        return {
          success: false,
          error: `Not enough stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}.`,
        };
      }

      pricedLines.push({
        productId: item.productId,
        variantId: item.variantId,
        productName: product.name,
        sku: product.sku,
        unitPrice: product.price,
        quantity: item.quantity,
        weight: product.weight,
      });
    }

    // 2. Validate coupon if provided
    let couponData: { record: ReturnType<typeof couponToRecord>; usage: { userUsage: number; totalUsage: number } } | null = null;

    if (couponCode) {
      const upperCode = couponCode.trim().toUpperCase();
      const couponSnap = await db.ref(`coupons/${upperCode}`).get();
      const coupon = couponSnap.val() as Coupon | null;

      if (coupon) {
        let userUsageCount = 0;
        if (session) {
          const userUsagesSnap = await db.ref(`couponUsages/${upperCode}/${session.uid}/orders`).get();
          userUsageCount = userUsagesSnap.exists() ? Object.keys(userUsagesSnap.val()).length : 0;
        }

        couponData = {
          record: couponToRecord(coupon),
          usage: {
            userUsage: userUsageCount,
            totalUsage: coupon.usageCount ?? 0,
          },
        };
      }
    }

    // 3. Compute immutable totals
    const totals = computeCartTotals({
      lines: pricedLines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
      coupon: couponData,
    });

    if (couponCode && !totals.couponEvaluation.valid) {
      return {
        success: false,
        error: `Coupon error: ${totals.couponEvaluation.error}. Please check the code or minimum order requirement.`,
      };
    }

    // 4. Reserve stock atomically
    const reservedLines: typeof pricedLines = [];
    for (const line of pricedLines) {
      const stockRef = db.ref(`products/${line.productId}/stock`);
      const { committed } = await stockRef.transaction((currentStock) => {
        // Firebase RTDB invokes with null before the server value is loaded locally.
        // Returning null allows it to fetch the server value without aborting.
        if (currentStock === null) {
          return currentStock;
        }
        if (typeof currentStock !== "number" || currentStock < line.quantity) {
          return undefined; // abort transaction because stock is truly insufficient
        }
        return currentStock - line.quantity;
      });

      if (!committed) {
        // Rollback any stock reserved in this batch
        for (const reserved of reservedLines) {
          const rollbackRef = db.ref(`products/${reserved.productId}/stock`);
          await rollbackRef.transaction((curr) =>
            typeof curr === "number" ? curr + reserved.quantity : reserved.quantity,
          );
        }

        return {
          success: false,
          error: `Stock changed for "${line.productName}". Available stock is insufficient. Please review your cart.`,
        };
      }

      reservedLines.push(line);
    }

    // 5. Create Order records
    const orderRef = db.ref("orders").push();
    const orderId = orderRef.key!;
    const userId = session?.uid || `guest_${orderId}`;

    const orderRecord: Order = {
      userId,
      status: paymentMethod === "cod" ? "CONFIRMED" : "PENDING",
      paymentMethod,
      addressName: address.name,
      addressPhone: address.phone,
      addressLine1: address.line1,
      addressLine2: address.line2 ?? null,
      addressCity: address.city,
      addressState: address.state,
      addressPincode: address.pincode,
      addressCountry: address.country || "India",
      subtotal: totals.subtotal,
      discount: totals.discount,
      couponId: couponCode ? couponCode.toUpperCase() : null,
      couponCode: couponCode ? couponCode.toUpperCase() : null,
      shipping: totals.shipping,
      total: totals.total,
      createdAt: now,
      updatedAt: now,
    };

    const updates: Record<string, unknown> = {};
    updates[`orders/${orderId}`] = orderRecord;

    // Order items
    for (const line of pricedLines) {
      const itemKey = db.ref(`orderItems/${orderId}`).push().key!;
      const orderItem: OrderItem = {
        productId: line.productId,
        variantId: line.variantId,
        productName: line.productName,
        sku: line.sku,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        total: line.unitPrice * line.quantity,
        weight: line.weight,
      };
      updates[`orderItems/${orderId}/${itemKey}`] = orderItem;
    }

    // Coupon tracking
    if (couponCode && totals.discount > 0) {
      const upperCode = couponCode.toUpperCase();
      if (session) {
        updates[`couponUsages/${upperCode}/${session.uid}/orders/${orderId}`] = true;
      }
      // Increment coupon usage count
      const couponUsageRef = db.ref(`coupons/${upperCode}/usageCount`);
      await couponUsageRef.transaction((count) => (count || 0) + 1);
    }

    // Clear user cart if signed in
    if (session) {
      updates[`carts/${session.uid}`] = null;
    }

    await db.ref().update(updates);

    // 6. Handle Razorpay vs COD
    if (paymentMethod === "razorpay") {
      const razorpay = getRazorpayClient();
      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(totals.total * 100), // in paise
        currency: "INR",
        receipt: orderId,
        notes: {
          orderId,
          userId,
        },
      });

      // Save initial payment record
      const paymentRef = db.ref("payments").push();
      const paymentRecord: Payment = {
        orderId,
        userId,
        razorpayOrderId: rzpOrder.id,
        razorpayPaymentId: null,
        razorpaySignature: null,
        method: "razorpay",
        amount: totals.total,
        currency: "INR",
        status: "PENDING",
        createdAt: now,
        updatedAt: now,
      };
      await paymentRef.set(paymentRecord);

      return {
        success: true,
        orderId,
        paymentMethod: "razorpay",
        razorpayOrderId: rzpOrder.id,
        amount: totals.total,
        currency: "INR",
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      };
    }

    // COD flow: order already CONFIRMED
    try {
      revalidatePath("/account/orders");
    } catch {
      // Ignored outside Next.js request context (e.g. unit tests)
    }

    return {
      success: true,
      orderId,
      paymentMethod: "cod",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to place order";
    return { success: false, error: msg };
  }
}

export async function verifyRazorpayPaymentAction(params: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

    const isValid = verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      return { success: false, error: "Invalid payment signature" };
    }

    const db = getAdminDb();
    const now = Date.now();

    // 1. Mark order CONFIRMED
    await db.ref(`orders/${orderId}`).update({
      status: "CONFIRMED",
      updatedAt: now,
    });

    // 2. Update payment record
    const paymentsSnap = await db
      .ref("payments")
      .orderByChild("orderId")
      .equalTo(orderId)
      .get();

    if (paymentsSnap.exists()) {
      const raw = paymentsSnap.val() as Record<string, Payment>;
      const paymentKey = Object.keys(raw)[0];
      await db.ref(`payments/${paymentKey}`).update({
        razorpayPaymentId,
        razorpaySignature,
        status: "PAID",
        updatedAt: now,
      });
    }

    try {
      revalidatePath(`/account/orders/${orderId}`);
      revalidatePath("/account/orders");
    } catch {
      // Ignored outside Next.js request context
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Payment verification failed";
    return { success: false, error: msg };
  }
}
