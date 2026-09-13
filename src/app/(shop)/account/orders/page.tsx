import type { Metadata } from "next";
import Link from "next/link";
import { Package, ArrowRight, Calendar, Star } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/primitives/button";
import { formatINR } from "@/lib/format";
import { getShopUser, getUserOrders } from "@/queries/shop";

export const metadata: Metadata = {
  title: "My Orders",
  robots: { index: false, follow: true },
};

function getStatusBadge(status: string) {
  switch (status) {
    case "CONFIRMED":
    case "PROCESSING":
      return "bg-blue-500/10 text-blue-700 border-blue-200";
    case "SHIPPED":
      return "bg-amber-500/10 text-amber-700 border-amber-200";
    case "DELIVERED":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
    case "RETURN_REQUESTED":
      return "bg-amber-500/15 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300";
    case "RETURN_APPROVED":
      return "bg-purple-500/15 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300";
    case "RETURN_REJECTED":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "REFUNDED":
      return "bg-emerald-500/15 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "CANCELLED":
    case "FAILED":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "PENDING":
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export default async function AccountOrdersPage() {
  const user = await getShopUser();
  const orders = user ? await getUserOrders(user.id) : [];

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package className="size-8" />}
        title="No orders yet"
        description="When you place an order, it will appear here with live tracking updates."
        actionHref="/products"
        actionLabel="Start shopping"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Your Orders</h2>
        <p className="text-sm text-muted-foreground">
          Track and view invoices for all your past purchases.
        </p>
      </div>

      <div className="divide-y rounded-3xl border bg-card overflow-hidden shadow-xs">
        {orders.map((order) => {
          const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          return (
            <div
              key={order.id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/10 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-foreground">
                    #{order.id.slice(-8).toUpperCase()}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getStatusBadge(
                      order.status,
                    )}`}
                  >
                    {order.status}
                  </span>
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                    {order.paymentMethod}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" /> {dateStr}
                  </span>
                  <span>
                    Total: <strong className="text-foreground">{formatINR(order.total)}</strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {order.status === "DELIVERED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-amber-300 text-amber-900 bg-amber-50/60 hover:bg-amber-100 hover:text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-300 font-medium"
                    render={<Link href={`/account/orders/${order.id}`} />}
                  >
                    <Star className="size-3.5 text-amber-500 fill-amber-500" />
                    Review Items
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  render={<Link href={`/account/orders/${order.id}`} />}
                >
                  View Details
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}