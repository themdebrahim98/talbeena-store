"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Search } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { toast } from "@/components/primitives/toast";
import { updateInventoryStockAction } from "@/actions/admin-catalog";
import type { AdminProductRow } from "@/queries/admin";

interface InventoryTableProps {
  initialProducts: AdminProductRow[];
}

export function InventoryTable({ initialProducts }: InventoryTableProps) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);

  const handleStockAdjust = async (slug: string, delta: number) => {
    const item = products.find((p) => p.slug === slug);
    if (!item) return;

    const newStock = Math.max(0, item.stock + delta);
    setUpdatingSlug(slug);

    try {
      const res = await updateInventoryStockAction(slug, newStock);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.slug === slug ? { ...p, stock: newStock } : p)),
        );
        toast.success(`Updated stock for ${item.name} to ${newStock}`);
      } else {
        toast.error(res.error || "Failed to update stock");
      }
    } catch {
      toast.error("Error adjusting stock");
    } finally {
      setUpdatingSlug(null);
    }
  };

  const handleDirectStockChange = async (slug: string, val: string) => {
    const newStock = parseInt(val, 10);
    if (isNaN(newStock) || newStock < 0) return;

    setUpdatingSlug(slug);
    try {
      const res = await updateInventoryStockAction(slug, newStock);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.slug === slug ? { ...p, stock: newStock } : p)),
        );
        toast.success("Stock updated");
      } else {
        toast.error(res.error || "Failed to update stock");
      }
    } catch {
      toast.error("Error setting stock");
    } finally {
      setUpdatingSlug(null);
    }
  };

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-sm text-muted-foreground">
            Fast live stock updates to prevent overselling and track replenishment needs.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by product or SKU…"
            className="pl-8 text-xs h-9 rounded-full bg-card"
          />
        </div>
      </div>

      {/* Mobile Card View (< md) */}
      <div className="space-y-3 md:hidden">
        {filtered.map((p) => {
          const isUpdating = updatingSlug === p.slug;
          const isOut = p.stock <= 0;
          const isLow = p.stock > 0 && p.stock <= p.lowStockThreshold;

          return (
            <div
              key={p.slug}
              className="rounded-2xl border bg-card p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/admin/products/${p.slug}`}
                    className="font-bold text-foreground text-sm hover:underline line-clamp-1"
                  >
                    {p.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="font-mono">{p.sku}</span>
                    <span>•</span>
                    <span>{p.categoryName}</span>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    isOut
                      ? "bg-destructive/10 text-destructive"
                      : isLow
                      ? "bg-amber-500/10 text-amber-700"
                      : "bg-emerald-500/10 text-emerald-700"
                  }`}
                >
                  {isOut ? "Out of Stock" : isLow ? `Low (${p.stock})` : `In Stock (${p.stock})`}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-xs text-muted-foreground">
                  Threshold: <strong className="text-foreground">{p.lowStockThreshold}</strong>
                </span>

                <div className="flex items-center gap-1 rounded-lg border bg-background p-1 shadow-xs">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-[11px]"
                    disabled={isUpdating || p.stock <= 0}
                    onClick={() => handleStockAdjust(p.slug, -5)}
                    title="Reduce by 5"
                  >
                    -5
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={isUpdating || p.stock <= 0}
                    onClick={() => handleStockAdjust(p.slug, -1)}
                    title="Reduce by 1"
                  >
                    <Minus className="size-3" />
                  </Button>
                  <input
                    type="number"
                    min={0}
                    key={p.stock}
                    defaultValue={p.stock}
                    onBlur={(e) => handleDirectStockChange(p.slug, e.target.value)}
                    className="w-10 text-center text-xs font-bold tabular-nums focus:outline-hidden"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={isUpdating}
                    onClick={() => handleStockAdjust(p.slug, 1)}
                    title="Add 1"
                  >
                    <Plus className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-[11px]"
                    disabled={isUpdating}
                    onClick={() => handleStockAdjust(p.slug, 10)}
                    title="Add 10"
                  >
                    +10
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-muted-foreground border rounded-2xl bg-card">
            No inventory records match your filter.
          </div>
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block rounded-3xl border bg-card overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">SKU</th>
              <th className="p-4">Category</th>
              <th className="p-4">Threshold</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Quick Stock Adjustment</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((p) => {
              const isUpdating = updatingSlug === p.slug;
              const isOut = p.stock <= 0;
              const isLow = p.stock > 0 && p.stock <= p.lowStockThreshold;

              return (
                <tr key={p.slug} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 font-semibold text-foreground">
                    <Link href={`/admin/products/${p.slug}`} className="hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="p-4 text-muted-foreground font-mono">{p.sku}</td>
                  <td className="p-4 text-muted-foreground">{p.categoryName}</td>
                  <td className="p-4 text-muted-foreground">{p.lowStockThreshold}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isOut
                          ? "bg-destructive/10 text-destructive"
                          : isLow
                          ? "bg-amber-500/10 text-amber-700"
                          : "bg-emerald-500/10 text-emerald-700"
                      }`}
                    >
                      {isOut ? "Out of Stock" : isLow ? `Low (${p.stock})` : "Healthy"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center gap-1.5 rounded-lg border bg-background p-1 shadow-xs">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        disabled={isUpdating || p.stock <= 0}
                        onClick={() => handleStockAdjust(p.slug, -5)}
                        title="Reduce by 5"
                      >
                        -5
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        disabled={isUpdating || p.stock <= 0}
                        onClick={() => handleStockAdjust(p.slug, -1)}
                        title="Reduce by 1"
                      >
                        <Minus className="size-3" />
                      </Button>
                      <input
                        type="number"
                        min={0}
                        key={p.stock}
                        defaultValue={p.stock}
                        onBlur={(e) => handleDirectStockChange(p.slug, e.target.value)}
                        className="w-12 text-center text-xs font-bold tabular-nums focus:outline-hidden"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        disabled={isUpdating}
                        onClick={() => handleStockAdjust(p.slug, 1)}
                        title="Add 1"
                      >
                        <Plus className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        disabled={isUpdating}
                        onClick={() => handleStockAdjust(p.slug, 10)}
                        title="Add 10"
                      >
                        +10
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
