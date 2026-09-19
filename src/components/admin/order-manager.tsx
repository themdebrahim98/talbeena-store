"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  Phone,
  Search,
  User,
  X,
} from "lucide-react";

import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { toast } from "@/components/primitives/toast";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { updateOrderStatusAction } from "@/actions/admin-orders";
import type { AdminOrderListItem } from "@/queries/admin";
import type { OrderStatus } from "@/types/firebase";

interface OrderManagerProps {
  initialOrders: AdminOrderListItem[];
  defaultFilter?: string;
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

const FILTER_TABS = [
  "ALL",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "RETURNS",
  "REFUNDED",
  "CANCELLED",
] as const;

function getStatusBadgeClasses(status: OrderStatus): string {
  switch (status) {
    case "DELIVERED":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    case "CONFIRMED":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30";
    case "PROCESSING":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
    case "SHIPPED":
      return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30";
    case "PENDING":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/30";
    case "RETURN_REQUESTED":
    case "RETURN_APPROVED":
    case "RETURN_REJECTED":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30";
    case "CANCELLED":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30";
    case "REFUNDED":
      return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function OrderManager({ initialOrders, defaultFilter }: OrderManagerProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<string>(defaultFilter || "ALL");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await updateOrderStatusAction(orderId, newStatus);
      if (res.success) {
        toast.success(`Order #${orderId.slice(-6)} updated to ${newStatus.replace("_", " ")}`);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        );
      } else {
        toast.error(res.error || "Failed to update order status");
      }
    } catch {
      toast.error("Error updating status");
    } finally {
      setUpdatingId(null);
    }
  };

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: orders.length };
    for (const o of orders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
      if (
        o.status === "RETURN_REQUESTED" ||
        o.status === "RETURN_APPROVED" ||
        o.status === "RETURN_REJECTED"
      ) {
        counts["RETURNS"] = (counts["RETURNS"] || 0) + 1;
      }
    }
    return counts;
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesFilter =
        filter === "ALL"
          ? true
          : filter === "RETURNS"
          ? o.status === "RETURN_REQUESTED" ||
            o.status === "RETURN_APPROVED" ||
            o.status === "RETURN_REJECTED"
          : o.status === filter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.addressName.toLowerCase().includes(q) ||
        o.addressPhone.includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, search]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Order Management</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              {filtered.length} {filtered.length === 1 ? "order" : "orders"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
            View, track, and update fulfillment statuses for all customer orders.
          </p>
        </div>
      </div>

      {/* Toolbar: Search + Filter Pills */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, customer name, or phone number…"
            className="pl-10 pr-9 text-xs sm:text-sm h-10 rounded-2xl bg-card border shadow-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Status Pills: horizontally scrollable on phone */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {FILTER_TABS.map((tab) => {
            const count = tabCounts[tab] || 0;
            const active = filter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95",
                  active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span>{tab.replace("_", " ")}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px]",
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-background/80 text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Content */}
      {filtered.length > 0 ? (
        <>
          {/* Mobile Card Layout (visible on phones, hidden on tablet/desktop) */}
          <div className="space-y-3 md:hidden">
            {filtered.map((order) => {
              const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const statusClasses = getStatusBadgeClasses(order.status);
              const isUpdating = updatingId === order.id;

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border bg-card p-4 shadow-xs space-y-3 transition hover:border-primary/40"
                >
                  {/* Card Header: Order ID + Payment & Date */}
                  <div className="flex items-center justify-between gap-2 border-b pb-2.5">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono font-bold text-sm text-foreground hover:text-primary transition underline-offset-4 hover:underline"
                    >
                      #{order.id.slice(-8).toUpperCase()}
                    </Link>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {order.paymentMethod}
                      </span>
                      <span className="text-xs text-muted-foreground">{dateStr}</span>
                    </div>
                  </div>

                  {/* Card Body: Customer & Total */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground truncate">
                        <User className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{order.addressName}</span>
                      </div>
                      <a
                        href={`tel:${order.addressPhone}`}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition truncate"
                      >
                        <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                        <span>{order.addressPhone}</span>
                      </a>
                      {order.addressCity && (
                        <p className="text-[11px] text-muted-foreground truncate pl-5">
                          {order.addressCity}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Total Amount
                      </span>
                      <span className="text-base font-bold text-foreground">
                        {formatINR(order.total)}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Status Selector + View Details Button */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t">
                    <div className="flex-1 max-w-[190px]">
                      <select
                        value={order.status}
                        disabled={isUpdating}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className={cn(
                          "w-full rounded-xl border px-2.5 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs cursor-pointer disabled:opacity-50",
                          statusClasses,
                        )}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option
                            key={opt}
                            value={opt}
                            className="bg-card text-foreground font-normal"
                          >
                            {opt.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs rounded-xl px-3 hover:bg-primary/10 hover:text-primary transition"
                      render={<Link href={`/admin/orders/${order.id}`} />}
                    >
                      <span>View</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (hidden on mobile, visible on md+) */}
          <div className="hidden md:block rounded-3xl border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((order) => {
                    const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                    const statusClasses = getStatusBadgeClasses(order.status);
                    const isUpdating = updatingId === order.id;

                    return (
                      <tr key={order.id} className="hover:bg-muted/15 transition-colors">
                        <td className="p-4 font-mono font-bold text-foreground">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="hover:text-primary hover:underline transition"
                          >
                            #{order.id.slice(-8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="p-4 text-muted-foreground whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-foreground">{order.addressName}</p>
                          <a
                            href={`tel:${order.addressPhone}`}
                            className="text-[11px] text-muted-foreground hover:text-foreground transition"
                          >
                            {order.addressPhone}
                          </a>
                        </td>
                        <td className="p-4 uppercase font-semibold text-muted-foreground">
                          {order.paymentMethod}
                        </td>
                        <td className="p-4 font-bold text-foreground text-sm whitespace-nowrap">
                          {formatINR(order.total)}
                        </td>
                        <td className="p-4">
                          <select
                            value={order.status}
                            disabled={isUpdating}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value as OrderStatus)
                            }
                            className={cn(
                              "rounded-xl border px-2.5 py-1 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs cursor-pointer disabled:opacity-50",
                              statusClasses,
                            )}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option
                                key={opt}
                                value={opt}
                                className="bg-card text-foreground font-normal"
                              >
                                {opt.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 rounded-xl hover:bg-primary/10 hover:text-primary transition"
                            render={<Link href={`/admin/orders/${order.id}`} />}
                          >
                            <Eye className="size-3.5" />
                            <span>View</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border bg-card p-12 text-center shadow-xs">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
            <Search className="size-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No orders found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            {search
              ? `No orders matched your search "${search}". Try searching by order ID, customer name, or phone number.`
              : `There are currently no orders in the "${filter.replace("_", " ")}" status category.`}
          </p>
          {(search || filter !== "ALL") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setFilter("ALL");
              }}
              className="text-xs rounded-xl"
            >
              Reset Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
