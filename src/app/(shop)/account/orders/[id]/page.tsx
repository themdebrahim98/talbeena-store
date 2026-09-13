import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Star,
} from "lucide-react";

import { Button } from "@/components/primitives/button";
import { formatINR } from "@/lib/format";
import { getOrderById, getShopUser, getUserProductReviews } from "@/queries/shop";
import { OrderReturnModal } from "@/components/shop/account/order-return-modal";
import { OrderTrackingStepper } from "@/components/shop/account/order-tracking-stepper";
import { OrderItemReviewButton } from "@/components/shop/account/order-item-review-button";
import { RETURN_REASONS } from "@/validations/return";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Order Details",
  robots: { index: false, follow: false },
};

function getStatusBadge(status: string) {
  switch (status) {
    case "CONFIRMED":
    case "PROCESSING":
      return "bg-blue-500/10 text-blue-700 border-blue-200 dark:border-blue-800/40 dark:text-blue-300";
    case "SHIPPED":
      return "bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-800/40 dark:text-amber-300";
    case "DELIVERED":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-800/40 dark:text-emerald-300";
    case "RETURN_REQUESTED":
      return "bg-amber-500/15 text-amber-800 border-amber-300 dark:border-amber-800/50 dark:text-amber-300";
    case "RETURN_APPROVED":
      return "bg-purple-500/15 text-purple-800 border-purple-300 dark:border-purple-800/50 dark:text-purple-300";
    case "RETURN_REJECTED":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "REFUNDED":
      return "bg-emerald-500/15 text-emerald-800 border-emerald-300 dark:border-emerald-800/50 dark:text-emerald-300";
    case "CANCELLED":
    case "FAILED":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "PENDING":
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const user = await getShopUser();
  const orderData = await getOrderById(id, user?.id);

  if (!orderData) {
    notFound();
  }

  const { order, items } = orderData;
  const isDelivered = order.status === "DELIVERED";
  const productIds = items.map((it) => it.productId);
  const userReviews =
    user && isDelivered ? await getUserProductReviews(user.id, productIds) : {};

  const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const reasonLabel =
    RETURN_REASONS.find((r) => r.value === order.returnReason)?.label ||
    order.returnReason ||
    "Return requested";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" render={<Link href="/account/orders" />}>
          <ArrowLeft className="size-4 mr-1" /> Back to Orders
        </Button>

        {order.status === "DELIVERED" && (
          <OrderReturnModal orderId={order.id} />
        )}
      </div>

      {/* Visual Fulfillment & Shipment Stepper */}
      <OrderTrackingStepper order={order} />

      {/* Return & Refund Status Banners */}
      {order.status === "RETURN_REQUESTED" && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50/70 p-4 text-xs text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">Return Request Under Review</p>
            <p>
              You submitted a return request for: <strong>{reasonLabel}</strong>.
              {order.returnComments && <span> Details: &ldquo;{order.returnComments}&rdquo;</span>}
            </p>
            <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80">
              Our team is reviewing your request and will provide pickup or return instructions shortly.
            </p>
          </div>
        </div>
      )}

      {order.status === "RETURN_APPROVED" && (
        <div className="flex items-start gap-3 rounded-2xl border border-purple-300 bg-purple-50/70 p-4 text-xs text-purple-900 dark:border-purple-800/50 dark:bg-purple-950/30 dark:text-purple-200">
          <RotateCcw className="size-5 shrink-0 text-purple-600 dark:text-purple-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">Return Approved</p>
            <p>
              Your return request has been approved. Please keep the item securely packed in its original packaging.
            </p>
            {order.adminNotes && (
              <p className="text-[11px] font-medium">Instructions: {order.adminNotes}</p>
            )}
            <p className="text-[11px] text-purple-700/90 dark:text-purple-300/80">
              Our pickup executive will collect the item, following which your refund will be released.
            </p>
          </div>
        </div>
      )}

      {order.status === "RETURN_REJECTED" && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
          <XCircle className="size-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">Return Request Declined</p>
            <p>
              {order.adminNotes
                ? `Reason: ${order.adminNotes}`
                : "This order does not meet our return & replacement policy."}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Please contact support if you believe this was an error.
            </p>
          </div>
        </div>
      )}

      {order.status === "REFUNDED" && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 text-xs text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">
              Refund Processed: {formatINR(order.refundAmount || order.total)}
            </p>
            <p>
              Refund has been completed.
              {order.refundId && (
                <span className="font-mono text-[11px] block mt-0.5">
                  Refund Reference: {order.refundId}
                </span>
              )}
            </p>
            {order.adminNotes && (
              <p className="text-[11px] text-muted-foreground">Note: {order.adminNotes}</p>
            )}
          </div>
        </div>
      )}

      <div className="rounded-3xl border bg-card p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Order #{order.id.slice(-8).toUpperCase()}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${getStatusBadge(
                  order.status,
                )}`}
              >
                {order.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <Calendar className="size-3.5" /> Placed on {dateStr}
            </p>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Payment Method: </span>
            <strong className="uppercase font-semibold text-foreground">
              {order.paymentMethod}
            </strong>
          </div>
        </div>

        {/* Shipping Address & Status */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border p-4 space-y-2 bg-muted/20">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" /> Delivery Address
            </h2>
            <div className="text-xs text-foreground space-y-0.5">
              <p className="font-semibold">{order.addressName}</p>
              <p className="text-muted-foreground">{order.addressPhone}</p>
              <p>{order.addressLine1}</p>
              {order.addressLine2 && <p>{order.addressLine2}</p>}
              <p>
                {order.addressCity}, {order.addressState} — {order.addressPincode}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border p-4 space-y-2 bg-muted/20">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Truck className="size-3.5 text-primary" /> Delivery Status
            </h2>
            <p className="text-xs text-foreground font-semibold">
              Current stage: {order.status.replace("_", " ")}
            </p>
            <p className="text-xs text-muted-foreground">
              Orders are freshly packed and typically delivered within 24–48 hours across India.
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight">Ordered Items</h2>
            {isDelivered && (
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <Star className="size-3 text-amber-500 fill-amber-500" />
                Delivered · You can rate & review each item
              </span>
            )}
          </div>

          <div className="rounded-2xl border divide-y overflow-hidden">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 text-xs hover:bg-muted/10 transition-colors"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-sm text-foreground">{item.productName}</p>
                  <p className="text-muted-foreground">
                    SKU: {item.sku} · Qty: {item.quantity} × {formatINR(item.unitPrice)}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  {isDelivered && (
                    <OrderItemReviewButton
                      productId={item.productId}
                      productName={item.productName}
                      existingReview={userReviews[item.productId] || null}
                    />
                  )}
                  <span className="font-bold text-sm text-foreground shrink-0">
                    {formatINR(item.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="space-y-2 text-xs border-t pt-4 max-w-sm ml-auto">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="text-foreground font-medium">{formatINR(order.subtotal)}</span>
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Coupon Discount ({order.couponCode})</span>
              <span>-{formatINR(order.discount)}</span>
            </div>
          )}

          <div className="flex justify-between text-muted-foreground">
            <span>Shipping Charge</span>
            <span className="text-foreground font-medium">
              {order.shipping === 0 ? "FREE" : formatINR(order.shipping)}
            </span>
          </div>

          <div className="flex justify-between border-t pt-2 text-sm font-bold">
            <span>Total Paid / Payable</span>
            <span className="text-primary text-base">{formatINR(order.total)}</span>
          </div>

          {order.status === "REFUNDED" && (
            <div className="flex justify-between border-t border-dashed pt-2 text-xs font-bold text-emerald-700">
              <span>Refunded Total</span>
              <span>{formatINR(order.refundAmount || order.total)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
