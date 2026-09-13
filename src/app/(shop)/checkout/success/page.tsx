import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/primitives/button";
import { formatINR } from "@/lib/format";
import { getOrderById } from "@/queries/shop";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  const orderData = orderId ? await getOrderById(orderId) : null;

  return (
    <div className="py-16">
      <Container className="max-w-2xl space-y-8">
        <div className="rounded-3xl border bg-card p-8 text-center space-y-4 shadow-sm">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="size-10" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Thank You! Your Order is Placed.
            </h1>
            <p className="text-sm text-muted-foreground">
              We have received your order and our team is preparing fresh packs with care.
            </p>
          </div>

          {orderId && (
            <div className="inline-block rounded-xl border bg-muted/40 px-4 py-2 text-xs font-semibold">
              Order ID: <span className="text-primary font-mono">{orderId}</span>
            </div>
          )}
        </div>

        {orderData && (
          <div className="rounded-3xl border bg-card p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Status</p>
                <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  {orderData.order.status}
                </span>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-xs text-muted-foreground">Payment Method</p>
                <p className="text-xs font-semibold uppercase">{orderData.order.paymentMethod}</p>
              </div>
            </div>

            {/* Delivery address snapshot */}
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-foreground">Delivery To:</p>
              <p className="text-muted-foreground">
                {orderData.order.addressName} ({orderData.order.addressPhone})
              </p>
              <p className="text-muted-foreground">
                {orderData.order.addressLine1}, {orderData.order.addressCity}{" "}
                {orderData.order.addressPincode}, {orderData.order.addressState}
              </p>
            </div>

            {/* Items summary */}
            <div className="space-y-3 border-t pt-4">
              <p className="text-xs font-semibold text-foreground">Items in this order:</p>
              <div className="divide-y text-xs">
                {orderData.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-2">
                    <span>
                      {item.productName} <span className="text-muted-foreground">× {item.quantity}</span>
                    </span>
                    <span className="font-semibold">{formatINR(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between border-t pt-4 text-sm font-bold">
              <span>Total Paid / Payable</span>
              <span className="text-primary text-base">{formatINR(orderData.order.total)}</span>
            </div>
          </div>
        )}

        {/* Action navigation buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {orderId && (
            <Button
              size="lg"
              variant="outline"
              className="gap-2"
              render={<Link href={`/account/orders/${orderId}`} />}
            >
              <Package className="size-4" />
              View Order Details
            </Button>
          )}
          <Button
            size="lg"
            className="gap-2"
            render={<Link href="/products" />}
          >
            Continue Shopping
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </Container>
    </div>
  );
}
