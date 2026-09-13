import Link from "next/link";
import {
  ArrowRight,
  IndianRupee,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardDescription } from "@/components/primitives/card";
import { Button } from "@/components/primitives/button";
import { formatINR } from "@/lib/format";
import { getAdminDashboardMetrics } from "@/queries/admin";

export const metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
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
    case "CANCELLED":
    case "FAILED":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "PENDING":
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export default async function AdminDashboardPage() {
  const metrics = await getAdminDashboardMetrics();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">
          Store health, live revenue, orders, and inventory status.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-3xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Total Revenue
            </CardDescription>
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IndianRupee className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatINR(metrics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From confirmed &amp; paid orders
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Orders Placed
            </CardDescription>
            <span className="flex size-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
              <ShoppingBag className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {metrics.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All store orders to date
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Active Products
            </CardDescription>
            <span className="flex size-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              <Package className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {metrics.totalProducts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Customers
            </CardDescription>
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Users className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {metrics.totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered customer profiles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Columns: Recent Orders + Low Stock Alerts */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Recent Orders */}
        <div className="space-y-4 lg:col-span-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Recent Orders</h2>
              <p className="text-xs text-muted-foreground">Latest incoming orders</p>
            </div>
            <Button variant="ghost" size="sm" render={<Link href="/admin/orders" />}>
              View All Orders <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </div>

          <div className="rounded-3xl border bg-card divide-y overflow-hidden shadow-xs">
            {metrics.recentOrders.length > 0 ? (
              metrics.recentOrders.map((order) => {
                const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                });
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 text-xs hover:bg-muted/10 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono font-bold hover:underline"
                        >
                          #{order.id.slice(-6).toUpperCase()}
                        </Link>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusBadge(
                            order.status,
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground">
                        {order.addressName} · {dateStr}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-foreground sm:text-sm">
                        {formatINR(order.total)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2.5"
                        render={<Link href={`/admin/orders/${order.id}`} />}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No orders received yet. Once customers order, they will show up here.
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Warning Card */}
        <div className="space-y-4 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Stock Alerts</h2>
              <p className="text-xs text-muted-foreground">
                {metrics.lowStockCount} product{metrics.lowStockCount !== 1 ? "s" : ""} low or out
              </p>
            </div>
            <Button variant="ghost" size="sm" render={<Link href="/admin/inventory" />}>
              Inventory <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </div>

          <div className="rounded-3xl border bg-card p-4 shadow-xs divide-y space-y-3">
            {metrics.lowStockProducts.length > 0 ? (
              metrics.lowStockProducts.map((p) => (
                <div key={p.slug} className="flex items-center justify-between pt-3 first:pt-0 text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold truncate text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">Threshold: {p.lowStockThreshold}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold shrink-0 ${
                      p.stock <= 0
                        ? "bg-destructive/10 text-destructive"
                        : "bg-amber-500/10 text-amber-700"
                    }`}
                  >
                    {p.stock <= 0 ? "Out of stock" : `${p.stock} left`}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                All products have healthy inventory levels!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}