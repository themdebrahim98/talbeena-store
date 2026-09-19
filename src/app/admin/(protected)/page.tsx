import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  IndianRupee,
  Package,
  Plus,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  Truck,
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
      return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30";
    case "PROCESSING":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
    case "SHIPPED":
      return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30";
    case "DELIVERED":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    case "RETURN_REQUESTED":
    case "RETURN_APPROVED":
    case "RETURN_REJECTED":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30";
    case "CANCELLED":
    case "FAILED":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30";
    case "PENDING":
    default:
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/30";
  }
}

export default async function AdminDashboardPage() {
  const metrics = await getAdminDashboardMetrics();

  const inFlightCount =
    (metrics.ordersByStatus.pending || 0) + (metrics.ordersByStatus.processing || 0);

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Store Live &amp; Accepting Orders
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Store Performance
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time overview of revenue, order fulfillment, and catalog health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-9"
            render={<Link href="/" target="_blank" />}
          >
            <ExternalLink className="size-3.5" />
            Live Storefront
          </Button>
          <Button
            size="sm"
            className="gap-1.5 text-xs h-9 shadow-xs"
            render={<Link href="/admin/products/new" />}
          >
            <Plus className="size-3.5" />
            Add Product
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs border-primary/20 bg-linear-to-br from-card via-card to-primary/5 relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-0">
            <CardDescription className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-foreground/80">
              Total Revenue
            </CardDescription>
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IndianRupee className="size-4" />
            </span>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {formatINR(metrics.totalRevenue)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] sm:text-xs">
              {metrics.todayRevenue > 0 ? (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  +{formatINR(metrics.todayRevenue)} today
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Avg {metrics.averageOrderValue > 0 ? formatINR(metrics.averageOrderValue) : "—"} / order
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orders Placed */}
        <Card className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-0">
            <CardDescription className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-foreground/80">
              Total Orders
            </CardDescription>
            <span className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <ShoppingBag className="size-4" />
            </span>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {metrics.totalOrders}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 truncate">
              {inFlightCount > 0 ? (
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {inFlightCount} orders need attention
                </span>
              ) : (
                "All orders fulfilled"
              )}
            </p>
          </CardContent>
        </Card>

        {/* Active Products */}
        <Card className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-0">
            <CardDescription className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-foreground/80">
              Catalog Items
            </CardDescription>
            <span className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Package className="size-4" />
            </span>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {metrics.totalProducts}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 truncate">
              {metrics.lowStockCount > 0 ? (
                <span className="font-semibold text-destructive">
                  {metrics.lowStockCount} items low / out
                </span>
              ) : (
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Healthy stock levels
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-0">
            <CardDescription className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-foreground/80">
              Customers
            </CardDescription>
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Users className="size-4" />
            </span>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {metrics.totalCustomers}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 truncate">
              Registered buyer profiles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fulfillment Pipeline Bar */}
      <div className="rounded-2xl sm:rounded-3xl border bg-card p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground">
              Order Fulfillment Pipeline
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Click any stage to filter active orders
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          {/* Pending */}
          <Link
            href="/admin/orders?status=PENDING"
            className="group rounded-xl border bg-muted/20 p-3 transition hover:bg-yellow-500/10 hover:border-yellow-500/30"
          >
            <div className="flex items-center justify-between text-muted-foreground group-hover:text-yellow-700 dark:group-hover:text-yellow-300">
              <span className="text-[11px] font-semibold">Pending</span>
              <Clock className="size-3.5" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-foreground mt-1">
              {metrics.ordersByStatus.pending || 0}
            </div>
          </Link>

          {/* Processing */}
          <Link
            href="/admin/orders?status=PROCESSING"
            className="group rounded-xl border bg-muted/20 p-3 transition hover:bg-blue-500/10 hover:border-blue-500/30"
          >
            <div className="flex items-center justify-between text-muted-foreground group-hover:text-blue-700 dark:group-hover:text-blue-300">
              <span className="text-[11px] font-semibold">Processing</span>
              <Package className="size-3.5" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-foreground mt-1">
              {metrics.ordersByStatus.processing || 0}
            </div>
          </Link>

          {/* Shipped */}
          <Link
            href="/admin/orders?status=SHIPPED"
            className="group rounded-xl border bg-muted/20 p-3 transition hover:bg-indigo-500/10 hover:border-indigo-500/30"
          >
            <div className="flex items-center justify-between text-muted-foreground group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
              <span className="text-[11px] font-semibold">In Transit</span>
              <Truck className="size-3.5" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-foreground mt-1">
              {metrics.ordersByStatus.shipped || 0}
            </div>
          </Link>

          {/* Delivered */}
          <Link
            href="/admin/orders?status=DELIVERED"
            className="group rounded-xl border bg-muted/20 p-3 transition hover:bg-emerald-500/10 hover:border-emerald-500/30"
          >
            <div className="flex items-center justify-between text-muted-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
              <span className="text-[11px] font-semibold">Delivered</span>
              <CheckCircle2 className="size-3.5" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-foreground mt-1">
              {metrics.ordersByStatus.delivered || 0}
            </div>
          </Link>

          {/* Returns */}
          <Link
            href="/admin/orders?status=RETURNS"
            className="group col-span-2 sm:col-span-1 rounded-xl border bg-muted/20 p-3 transition hover:bg-purple-500/10 hover:border-purple-500/30"
          >
            <div className="flex items-center justify-between text-muted-foreground group-hover:text-purple-700 dark:group-hover:text-purple-300">
              <span className="text-[11px] font-semibold">Returns &amp; Issues</span>
              <AlertTriangle className="size-3.5" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-foreground mt-1">
              {metrics.ordersByStatus.returns || 0}
            </div>
          </Link>
        </div>
      </div>

      {/* Two Columns: Recent Orders + Low Stock Alerts */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Recent Orders */}
        <div className="space-y-6 lg:col-span-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight">Recent Orders</h2>
                <p className="text-xs text-muted-foreground">Latest incoming customer purchases</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8"
                render={<Link href="/admin/orders" />}
              >
                View All ({metrics.totalOrders}) <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border bg-card divide-y overflow-hidden shadow-xs">
              {metrics.recentOrders.length > 0 ? (
                metrics.recentOrders.map((order) => {
                  const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={order.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 text-xs hover:bg-muted/10 transition-colors gap-3"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-mono font-bold hover:underline hover:text-primary transition"
                          >
                            #{order.id.slice(-6).toUpperCase()}
                          </Link>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(
                              order.status,
                            )}`}
                          >
                            {order.status}
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">
                            {order.paymentMethod}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs truncate">
                          <strong className="text-foreground">{order.addressName}</strong>
                          {order.addressCity ? ` · ${order.addressCity}` : ""} · {dateStr}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 shrink-0">
                        <span className="font-bold text-foreground text-sm sm:text-base">
                          {formatINR(order.total)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 px-3 rounded-lg"
                          render={<Link href={`/admin/orders/${order.id}`} />}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-10 text-center text-xs text-muted-foreground space-y-2">
                  <ShoppingBag className="size-8 mx-auto text-muted-foreground/40" />
                  <p className="font-semibold text-sm">No orders yet</p>
                  <p>When customers buy through the store, orders will appear here in real time.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/admin/inventory"
              className="group rounded-2xl border bg-card p-4 shadow-xs transition hover:border-primary/50 hover:bg-muted/10 space-y-1.5"
            >
              <div className="flex items-center justify-between text-muted-foreground group-hover:text-primary">
                <span className="font-bold text-xs">Inventory Monitor</span>
                <ArrowUpRight className="size-3.5" />
              </div>
              <p className="text-xs text-muted-foreground">
                Stock replenishment, threshold alerts &amp; live adjustments.
              </p>
            </Link>

            <Link
              href="/admin/coupons"
              className="group rounded-2xl border bg-card p-4 shadow-xs transition hover:border-primary/50 hover:bg-muted/10 space-y-1.5"
            >
              <div className="flex items-center justify-between text-muted-foreground group-hover:text-primary">
                <span className="font-bold text-xs">Promo Codes</span>
                <Tag className="size-3.5" />
              </div>
              <p className="text-xs text-muted-foreground">
                Discounts, festive offers, and customer retention coupons.
              </p>
            </Link>

            <Link
              href="/admin/categories"
              className="group rounded-2xl border bg-card p-4 shadow-xs transition hover:border-primary/50 hover:bg-muted/10 space-y-1.5"
            >
              <div className="flex items-center justify-between text-muted-foreground group-hover:text-primary">
                <span className="font-bold text-xs">Categories</span>
                <ArrowUpRight className="size-3.5" />
              </div>
              <p className="text-xs text-muted-foreground">
                Departments, storefront hierarchy &amp; catalog sort ordering.
              </p>
            </Link>
          </div>
        </div>

        {/* Right Column: Stock Alerts & Store Insights */}
        <div className="space-y-6 lg:col-span-4">
          {/* Low Stock Warning Card */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight">Stock Health</h2>
                <p className="text-xs text-muted-foreground">
                  {metrics.lowStockCount} product{metrics.lowStockCount !== 1 ? "s" : ""} need restock
                </p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-8" render={<Link href="/admin/inventory" />}>
                Inventory <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border bg-card p-4 shadow-xs divide-y space-y-3">
              {metrics.lowStockProducts.length > 0 ? (
                metrics.lowStockProducts.map((p) => (
                  <div key={p.slug} className="flex items-center justify-between pt-3 first:pt-0 text-xs">
                    <div className="min-w-0 pr-2 space-y-0.5">
                      <p className="font-semibold truncate text-foreground">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{p.sku} · Alert at {p.lowStockThreshold}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${
                        p.stock <= 0
                          ? "bg-destructive/10 text-destructive"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {p.stock <= 0 ? "Out of stock" : `${p.stock} left`}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground space-y-2">
                  <CheckCircle2 className="size-6 text-emerald-600 mx-auto" />
                  <p className="font-semibold text-foreground">Healthy Inventory</p>
                  <p className="text-[11px]">All catalog products are above alert thresholds.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Operations Insight Card */}
          <div className="rounded-2xl sm:rounded-3xl border bg-card p-5 shadow-xs space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Store Configuration
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-muted-foreground">Free Shipping</span>
                <span className="font-semibold text-foreground">Orders above ₹999</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-muted-foreground">Store Currency</span>
                <span className="font-semibold text-foreground">INR (₹)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-muted-foreground">Accepted Payments</span>
                <span className="font-semibold text-foreground">Razorpay &amp; Cash on Delivery</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Registered Customers</span>
                <Link href="/admin/customers" className="font-semibold text-primary hover:underline">
                  View Directory ({metrics.totalCustomers})
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}