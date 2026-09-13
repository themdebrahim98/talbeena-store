import Link from "next/link";
import { ArrowRight, Calendar, Package } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/primitives/card";
import { Button } from "@/components/primitives/button";
import { ProfileForm } from "@/components/shop/account/profile-form";
import { formatINR } from "@/lib/format";
import { getShopUser, getUserOrders } from "@/queries/shop";

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

export default async function AccountPage() {
  const user = await getShopUser();
  const orders = user ? await getUserOrders(user.id) : [];
  const recentOrders = orders.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Profile Info */}
      <Card className="rounded-3xl shadow-xs">
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Update your personal and contact details</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            fullName={user?.fullName ?? ""}
            phone={user?.phone ?? null}
            email={user?.email ?? ""}
          />
        </CardContent>
      </Card>

      {/* Recent Orders inside Profile */}
      <Card className="rounded-3xl shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Overview of your most recent purchases</CardDescription>
          </div>
          {orders.length > 0 && (
            <Button variant="ghost" size="sm" render={<Link href="/account/orders" />}>
              View All ({orders.length}) <ArrowRight className="size-3.5 ml-1" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="divide-y rounded-2xl border overflow-hidden">
              {recentOrders.map((order) => {
                const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                return (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/10 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">
                          #{order.id.slice(-8).toUpperCase()}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(
                            order.status,
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" /> {dateStr}
                        </span>
                        <span>
                          Total: <strong className="text-foreground">{formatINR(order.total)}</strong>
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs shrink-0"
                      render={<Link href={`/account/orders/${order.id}`} />}
                    >
                      View Invoice
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
              <Package className="size-8 mx-auto text-muted-foreground/50" />
              <p className="font-semibold text-sm">No orders yet</p>
              <p>When you place an order, it will appear here with live tracking.</p>
              <Button size="sm" render={<Link href="/products" />} className="mt-2">
                Start shopping
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}