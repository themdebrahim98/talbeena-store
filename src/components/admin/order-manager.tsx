"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Eye } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { toast } from "@/components/primitives/toast";
import { formatINR } from "@/lib/format";
import { updateOrderStatusAction } from "@/actions/admin-orders";
import type { AdminOrderListItem } from "@/queries/admin";
import type { OrderStatus } from "@/types/firebase";

interface OrderManagerProps {
  initialOrders: AdminOrderListItem[];
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

export function OrderManager({ initialOrders }: OrderManagerProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
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
    }
  };

  const filtered = orders.filter((o) => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Order Management</h1>
        <p className="text-sm text-muted-foreground">
          View, track, and update fulfillment statuses for all store customer orders.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          {[
            "ALL",
            "CONFIRMED",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "RETURNS",
            "REFUNDED",
            "CANCELLED",
          ].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                filter === tab
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID or name…"
            className="pl-8 text-xs h-9 rounded-full bg-card"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl border bg-card overflow-hidden shadow-xs">
        {filtered.length > 0 ? (
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
                });
                return (
                  <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-mono font-bold text-foreground">
                      <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                        #{order.id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="p-4 text-muted-foreground">{dateStr}</td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground">{order.addressName}</p>
                      <p className="text-[11px] text-muted-foreground">{order.addressPhone}</p>
                    </td>
                    <td className="p-4 uppercase font-semibold text-muted-foreground">
                      {order.paymentMethod}
                    </td>
                    <td className="p-4 font-bold text-foreground sm:text-sm">
                      {formatINR(order.total)}
                    </td>
                    <td className="p-4">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className="rounded-lg border bg-card px-2 py-1 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        render={<Link href={`/admin/orders/${order.id}`} />}
                      >
                        <Eye className="size-3.5" /> View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-10 text-center text-xs text-muted-foreground">
            No orders match your filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
