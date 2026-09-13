"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Truck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/primitives/button";
import { toast } from "@/components/primitives/toast";
import type { Order } from "@/types/firebase";

interface OrderTrackingStepperProps {
  order: Order & { id: string };
}

export function OrderTrackingStepper({ order }: OrderTrackingStepperProps) {
  const [copied, setCopied] = useState(false);

  const copyTracking = () => {
    if (order.trackingNumber) {
      navigator.clipboard.writeText(order.trackingNumber);
      setCopied(true);
      toast.success("Tracking number copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isCancelled = order.status === "CANCELLED" || order.status === "FAILED";
  const isReturn =
    order.status === "RETURN_REQUESTED" ||
    order.status === "RETURN_APPROVED" ||
    order.status === "RETURN_REJECTED" ||
    order.status === "REFUNDED";

  // Calculate stage index (0 to 4)
  const getStageIndex = () => {
    if (isCancelled) return 0;
    if (isReturn || order.status === "DELIVERED") return 4;
    switch (order.status) {
      case "SHIPPED":
        return 3;
      case "PROCESSING":
        return 2;
      case "CONFIRMED":
        return 1;
      case "PENDING":
      default:
        return 0;
    }
  };

  const currentStage = getStageIndex();

  const stages = [
    { label: "Order Placed", desc: "Order details received" },
    { label: "Confirmed", desc: "Payment verified" },
    { label: "Processing", desc: "Packed with fresh batches" },
    { label: "Shipped", desc: order.carrier ? `Via ${order.carrier}` : "Handed to courier" },
    { label: "Delivered", desc: "Arrived at destination" },
  ];

  const shippedDateStr = order.shippedAt
    ? new Date(order.shippedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    : null;

  const estimatedDeliveryStr = order.estimatedDeliveryAt
    ? new Date(order.estimatedDeliveryAt).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="rounded-3xl border bg-card/60 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
        <div>
          <h3 className="text-base font-bold tracking-tight text-foreground">
            Order Status &amp; Tracking
          </h3>
          <p className="text-xs text-muted-foreground">
            Live updates for parcel fulfillment
          </p>
        </div>

        {order.status === "SHIPPED" && estimatedDeliveryStr && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Clock className="size-3.5" />
            Estimated Delivery: {estimatedDeliveryStr}
          </div>
        )}
      </div>

      {isCancelled ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3 text-destructive">
          <XCircle className="size-5 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-sm">This order was cancelled</p>
            <p className="text-destructive/80 mt-0.5">
              Items were returned to inventory. If you were charged, a refund has been issued.
            </p>
          </div>
        </div>
      ) : (
        /* 5-Step Visual Stepper */
        <div className="relative pt-2 pb-4">
          <div className="grid grid-cols-5 gap-2 text-center">
            {stages.map((stage, idx) => {
              const isCompleted = currentStage >= idx;
              const isCurrent = currentStage === idx;

              return (
                <div key={stage.label} className="flex flex-col items-center relative z-10 space-y-2">
                  {/* Step Circle */}
                  <div
                    className={`flex size-8 sm:size-10 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      isCompleted
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-xs"
                        : "bg-muted text-muted-foreground border"
                    } ${isCurrent && !isCompleted ? "ring-4 ring-primary/30 animate-pulse" : ""}`}
                  >
                    {isCompleted ? (
                      <Check className="size-4 sm:size-5 stroke-[2.5]" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="space-y-0.5 px-1">
                    <p
                      className={`text-[11px] sm:text-xs font-bold leading-tight ${
                        isCompleted ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {stage.label}
                    </p>
                    <p className="hidden sm:block text-[10px] text-muted-foreground line-clamp-1">
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Background Connecting Line */}
          <div className="absolute top-6 sm:top-7 left-[10%] right-[10%] h-1 bg-muted -z-0">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{
                width: `${(currentStage / (stages.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Shipment & Courier Card (when shipped or tracking available) */}
      {order.trackingNumber && (
        <div className="rounded-2xl border bg-accent/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Truck className="size-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">
                  {order.carrier || "Courier Partner"}
                </span>
                {shippedDateStr && (
                  <span className="text-[11px] text-muted-foreground">
                    Dispatched on {shippedDateStr}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">AWB / Tracking:</span>
                <span className="font-mono font-bold text-foreground">
                  {order.trackingNumber}
                </span>
                <button
                  type="button"
                  onClick={copyTracking}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  title="Copy Tracking Number"
                >
                  {copied ? (
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {order.trackingUrl && (
            <Button
              size="sm"
              variant="outline"
              render={
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              className="inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              Track Package <ExternalLink className="size-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
