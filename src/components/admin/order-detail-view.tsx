"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Phone,
  User,
  RotateCcw,
  Banknote,
  Truck,
  ExternalLink,
  X,
} from "lucide-react";

import { Button } from "@/components/primitives/button";
import { toast } from "@/components/primitives/toast";
import { formatINR } from "@/lib/format";
import {
  updateOrderStatusAction,
  updateReturnReviewAction,
  processOrderRefundAction,
  updateOrderShipmentAction,
} from "@/actions/admin-orders";
import { RETURN_REASONS } from "@/validations/return";
import { COURIER_PARTNERS } from "@/validations/shipment";
import type { AdminOrderDetailFull } from "@/queries/admin";
import type { OrderStatus } from "@/types/firebase";

interface OrderDetailViewProps {
  orderData: AdminOrderDetailFull;
}

const STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "RETURN_REQUESTED",
  "RETURN_APPROVED",
  "RETURN_REJECTED",
  "REFUNDED",
  "CANCELLED",
];

export function OrderDetailView({ orderData }: OrderDetailViewProps) {
  const { order, items, payment } = orderData;
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || "");
  const [restoreStock, setRestoreStock] = useState(true);

  // Shipment Tracking State
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [carrier, setCarrier] = useState(order.carrier || "Delhivery");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [customTrackingUrl, setCustomTrackingUrl] = useState(order.trackingUrl || "");
  const [estimatedDays, setEstimatedDays] = useState(3);
  const [shipmentInfo, setShipmentInfo] = useState({
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    estimatedDeliveryAt: order.estimatedDeliveryAt,
  });

  const handleSaveShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      toast.error("Please enter a tracking/AWB number");
      return;
    }

    setUpdating(true);
    try {
      const res = await updateOrderShipmentAction(order.id, {
        carrier,
        trackingNumber: trackingNumber.trim(),
        trackingUrl: customTrackingUrl.trim() || undefined,
        estimatedDeliveryDays: estimatedDays,
      });

      if (res.success) {
        setStatus("SHIPPED");
        const now = Date.now();
        setShipmentInfo({
          carrier,
          trackingNumber: trackingNumber.trim(),
          trackingUrl: customTrackingUrl.trim() || null,
          estimatedDeliveryAt: now + estimatedDays * 86400000,
        });
        setIsShippingOpen(false);
        toast.success("Shipment details updated and order marked SHIPPED!");
      } else {
        toast.error(res.error || "Failed to update shipment");
      }
    } catch {
      toast.error("Error saving shipment");
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setUpdating(true);
    try {
      const res = await updateOrderStatusAction(order.id, newStatus);
      if (res.success) {
        setStatus(newStatus);
        toast.success(`Order marked as ${newStatus.replace("_", " ")}`);
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch {
      toast.error("Error updating status");
    } finally {
      setUpdating(false);
    }
  };

  const handleReturnDecision = async (decision: "RETURN_APPROVED" | "RETURN_REJECTED") => {
    setUpdating(true);
    try {
      const res = await updateReturnReviewAction(order.id, decision, adminNotes);
      if (res.success) {
        setStatus(decision);
        toast.success(
          decision === "RETURN_APPROVED" ? "Return request approved" : "Return request rejected",
        );
      } else {
        toast.error(res.error || "Failed to submit decision");
      }
    } catch {
      toast.error("Error updating return decision");
    } finally {
      setUpdating(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!confirm(`Are you sure you want to process a refund of ${formatINR(order.total)}?`)) {
      return;
    }

    setUpdating(true);
    try {
      const res = await processOrderRefundAction(order.id, {
        restoreStock,
        adminNotes,
      });

      if (res.success) {
        setStatus("REFUNDED");
        toast.success(`Refund processed successfully. ID: ${res.refundId}`);
      } else {
        toast.error(res.error || "Failed to process refund");
      }
    } catch {
      toast.error("Error processing refund");
    } finally {
      setUpdating(false);
    }
  };

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
    "Not specified";

  const isReturnActive =
    status === "RETURN_REQUESTED" ||
    status === "RETURN_APPROVED" ||
    status === "RETURN_REJECTED" ||
    status === "REFUNDED" ||
    Boolean(order.returnRequestedAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="self-start gap-1.5"
          render={<Link href="/admin/orders" />}
        >
          <ArrowLeft className="size-4" /> Back to Orders
        </Button>

        <div className="flex items-center justify-between sm:justify-end gap-2 bg-card sm:bg-transparent p-2 sm:p-0 rounded-2xl border sm:border-0 shadow-xs sm:shadow-none">
          <span className="text-xs font-semibold text-muted-foreground">Order Status:</span>
          <select
            value={status}
            disabled={updating}
            onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
            className="rounded-xl border bg-background px-3 py-1.5 text-xs font-bold focus-visible:ring-2 focus-visible:ring-primary shadow-xs cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Return & Refund Action Panel */}
      {isReturnActive && (
        <div className="rounded-3xl border border-amber-300 bg-amber-50/40 p-6 dark:border-amber-800/40 dark:bg-amber-950/20 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800/40 pb-3">
            <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <RotateCcw className="size-4 text-amber-600 dark:text-amber-400" />
              Return & Refund Management
            </h2>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              {status.replace("_", " ")}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="space-y-1">
              <p className="text-muted-foreground">Return Reason:</p>
              <p className="font-semibold text-foreground">{reasonLabel}</p>
              {order.returnComments && (
                <p className="text-muted-foreground italic mt-1 bg-background/50 p-2 rounded-lg border">
                  &ldquo;{order.returnComments}&rdquo;
                </p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground">Payment & Refund Snapshot:</p>
              <p className="font-semibold text-foreground">
                Total: {formatINR(order.total)} via {order.paymentMethod.toUpperCase()}
              </p>
              {order.refundId && (
                <p className="text-emerald-700 font-mono text-[11px]">
                  Refund Reference: {order.refundId}
                </p>
              )}
            </div>
          </div>

          {status !== "REFUNDED" && (
            <div className="space-y-3 pt-2 border-t border-amber-200 dark:border-amber-800/40">
              <div className="space-y-1">
                <label htmlFor="admin-notes" className="text-xs font-semibold text-foreground block">
                  Staff Notes / Instructions:
                </label>
                <input
                  id="admin-notes"
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Approved. Customer will ship to warehouse."
                  className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="restore-stock-cb"
                  checked={restoreStock}
                  onChange={(e) => setRestoreStock(e.target.checked)}
                  className="rounded border-muted-foreground"
                />
                <label htmlFor="restore-stock-cb" className="text-xs text-foreground cursor-pointer">
                  Restock product inventory on refund
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {status === "RETURN_REQUESTED" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updating}
                      onClick={() => handleReturnDecision("RETURN_APPROVED")}
                      className="border-purple-300 text-purple-800 hover:bg-purple-50"
                    >
                      Approve Return
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updating}
                      onClick={() => handleReturnDecision("RETURN_REJECTED")}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      Reject Return
                    </Button>
                  </>
                )}

                <Button
                  size="sm"
                  disabled={updating}
                  onClick={handleProcessRefund}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
                >
                  <Banknote className="size-3.5" />
                  Issue Refund ({formatINR(order.total)})
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl border bg-card p-6 sm:p-8 space-y-8 shadow-xs">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Order #{order.id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Placed on {dateStr} · User ID: <span className="font-mono">{order.userId}</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-muted-foreground">Total: </span>
            <span className="text-xl font-bold text-primary">{formatINR(order.total)}</span>
          </div>
        </div>

        {/* 3 Overview Cards: Customer, Shipping, Payment */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border p-4 space-y-1.5 bg-muted/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="size-3.5 text-primary" /> Customer
            </h3>
            <p className="text-xs font-semibold text-foreground">{order.addressName}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="size-3 text-muted-foreground" /> {order.addressPhone}
            </p>
          </div>

          <div className="rounded-2xl border p-4 space-y-1.5 bg-muted/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" /> Delivery Address
            </h3>
            <p className="text-xs text-foreground/90">
              {order.addressLine1}
              {order.addressLine2 ? `, ${order.addressLine2}` : ""}
              <br />
              {order.addressCity}, {order.addressState} — {order.addressPincode}
            </p>
          </div>

          <div className="rounded-2xl border p-4 space-y-1.5 bg-muted/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="size-3.5 text-primary" /> Payment Snapshot
            </h3>
            <p className="text-xs font-semibold uppercase">{order.paymentMethod}</p>
            {payment && (
              <p className="text-[11px] text-muted-foreground font-mono truncate">
                Rzp: {payment.razorpayOrderId} ({payment.status})
              </p>
            )}
          </div>
        </div>

        {/* Courier & Shipment Fulfillment Card */}
        <div className="rounded-2xl border p-5 bg-card/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Truck className="size-4 text-primary" />
              Courier &amp; Logistics Tracking
            </h3>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsShippingOpen(true)}
              disabled={updating}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto text-xs"
            >
              <Truck className="size-3.5" />
              {shipmentInfo.trackingNumber ? "Update Tracking" : "Dispatch / Add Tracking"}
            </Button>
          </div>

          {shipmentInfo.trackingNumber ? (
            <div className="grid gap-4 sm:grid-cols-3 text-xs">
              <div>
                <span className="text-muted-foreground block">Courier Partner:</span>
                <span className="font-bold text-sm text-foreground">{shipmentInfo.carrier || "Delhivery"}</span>
              </div>

              <div>
                <span className="text-muted-foreground block">AWB / Tracking Number:</span>
                <span className="font-mono font-bold text-sm text-foreground">
                  {shipmentInfo.trackingNumber}
                </span>
                {shipmentInfo.trackingUrl && (
                  <a
                    href={shipmentInfo.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline ml-2"
                  >
                    Track <ExternalLink className="size-3" />
                  </a>
                )}
              </div>

              <div>
                <span className="text-muted-foreground block">Estimated Delivery:</span>
                <span className="font-semibold text-foreground">
                  {shipmentInfo.estimatedDeliveryAt
                    ? new Date(shipmentInfo.estimatedDeliveryAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Not specified"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No tracking details attached yet. Click &ldquo;Dispatch / Add Tracking&rdquo; to record courier details and update status.
            </p>
          )}
        </div>

        {/* Ordered items */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold tracking-tight">Ordered Products</h3>
          <div className="rounded-2xl border divide-y overflow-hidden">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 text-xs">
                <div>
                  <p className="font-semibold text-sm text-foreground">{item.productName}</p>
                  <p className="text-muted-foreground">
                    SKU: {item.sku} · Qty: {item.quantity} × {formatINR(item.unitPrice)}
                  </p>
                </div>
                <span className="font-bold text-sm text-foreground">
                  {formatINR(item.total)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial breakdown */}
        <div className="space-y-2 text-xs border-t pt-4 max-w-xs ml-auto">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="text-foreground font-medium">{formatINR(order.subtotal)}</span>
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Discount ({order.couponCode})</span>
              <span>-{formatINR(order.discount)}</span>
            </div>
          )}

          <div className="flex justify-between text-muted-foreground">
            <span>Delivery</span>
            <span className="text-foreground font-medium">
              {order.shipping === 0 ? "FREE" : formatINR(order.shipping)}
            </span>
          </div>

          <div className="flex justify-between border-t pt-2 text-sm font-bold">
            <span>Grand Total</span>
            <span className="text-primary text-base">{formatINR(order.total)}</span>
          </div>

          {order.status === "REFUNDED" && (
            <div className="flex justify-between border-t border-dashed pt-2 text-xs font-bold text-emerald-700">
              <span>Refunded Amount</span>
              <span>{formatINR(order.refundAmount || order.total)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Shipping / Dispatch Modal */}
      {isShippingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
                <Truck className="size-4 text-primary" />
                Dispatch &amp; Shipment Details
              </h3>
              <button
                type="button"
                onClick={() => setIsShippingOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveShipment} className="space-y-4 text-xs">
              {/* Courier selector */}
              <div className="space-y-1.5">
                <label htmlFor="carrier-select" className="font-semibold text-foreground block">
                  Courier Partner:
                </label>
                <select
                  id="carrier-select"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                >
                  {COURIER_PARTNERS.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* AWB number */}
              <div className="space-y-1.5">
                <label htmlFor="awb-input" className="font-semibold text-foreground block">
                  AWB / Tracking Number <span className="text-destructive">*</span>:
                </label>
                <input
                  id="awb-input"
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 140123456789"
                  required
                  className="w-full rounded-xl border bg-background px-3 py-2 text-xs font-mono focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                />
              </div>

              {/* Custom tracking URL */}
              <div className="space-y-1.5">
                <label htmlFor="tracking-url-input" className="font-semibold text-foreground block">
                  Custom Tracking URL (Optional):
                </label>
                <input
                  id="tracking-url-input"
                  type="url"
                  value={customTrackingUrl}
                  onChange={(e) => setCustomTrackingUrl(e.target.value)}
                  placeholder="Leave empty to auto-generate from courier"
                  className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                />
              </div>

              {/* Estimated Delivery Days */}
              <div className="space-y-1.5">
                <label htmlFor="est-days-input" className="font-semibold text-foreground block">
                  Estimated Delivery Time (Days):
                </label>
                <input
                  id="est-days-input"
                  type="number"
                  min={1}
                  max={30}
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(Number(e.target.value))}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsShippingOpen(false)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={updating}>
                  {updating ? "Saving..." : "Save & Mark as Shipped"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
