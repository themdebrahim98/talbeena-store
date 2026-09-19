"use client";

import { useState } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { toast } from "@/components/primitives/toast";
import { formatINR } from "@/lib/format";
import { saveCouponAction, deleteCouponAction } from "@/actions/admin-catalog";
import type { AdminCouponRow } from "@/queries/admin";

interface CouponManagerProps {
  initialCoupons: AdminCouponRow[];
}

export function CouponManager({ initialCoupons }: CouponManagerProps) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: 10,
    minOrderAmount: 0,
    maxDiscount: "",
    perUserLimit: 1,
    usageLimit: "",
    isActive: true,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const code = formData.code.trim().toUpperCase();
      const res = await saveCouponAction({
        code,
        type: formData.type,
        value: Number(formData.value),
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        perUserLimit: Number(formData.perUserLimit) || 1,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        isActive: formData.isActive,
      });

      if (res.success) {
        toast.success(`Coupon "${code}" saved successfully`);
        setShowForm(false);
        setCoupons((prev) => [
          ...prev.filter((c) => c.code !== code),
          {
            id: code,
            code,
            type: formData.type,
            value: Number(formData.value),
            minOrderAmount: Number(formData.minOrderAmount) || 0,
            maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
            perUserLimit: Number(formData.perUserLimit) || 1,
            usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
            usageCount: 0,
            startsAt: null,
            expiresAt: null,
            isActive: formData.isActive,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ]);
        setFormData({
          code: "",
          type: "percentage",
          value: 10,
          minOrderAmount: 0,
          maxDiscount: "",
          perUserLimit: 1,
          usageLimit: "",
          isActive: true,
        });
      } else {
        toast.error(res.error || "Failed to save coupon");
      }
    } catch {
      toast.error("Error saving coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    const res = await deleteCouponAction(code);
    if (res.success) {
      setCoupons((prev) => prev.filter((c) => c.code !== code));
      toast.info("Coupon deleted");
    } else {
      toast.error(res.error || "Failed to delete coupon");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Coupons &amp; Promotions</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Create discount codes to drive customer conversions and reward loyal shoppers.
          </p>
        </div>

        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-1.5 w-full sm:w-auto" size="sm">
            <Plus className="size-4" /> Create Coupon
          </Button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl sm:rounded-3xl border bg-card p-4 sm:p-6 shadow-xs space-y-4 max-w-2xl"
        >
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-bold text-sm">Create New Promo Coupon</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-code">Coupon Code *</Label>
              <Input
                id="c-code"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. FESTIVE20"
                className="uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-type">Discount Type</Label>
              <select
                id="c-type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as "percentage" | "fixed" })
                }
                className="h-9 w-full rounded-md border bg-card px-3 text-xs focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-val">Discount Value *</Label>
              <Input
                id="c-val"
                type="number"
                required
                min={1}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-min">Min Order Amount (₹)</Label>
              <Input
                id="c-min"
                type="number"
                min={0}
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-max">Max Cap (₹, optional)</Label>
              <Input
                id="c-max"
                type="number"
                min={0}
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                placeholder="Unlimited"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-limit">Usage Limit (optional)</Label>
              <Input
                id="c-limit"
                type="number"
                min={1}
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="c-active"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-input text-primary focus:ring-primary size-4"
            />
            <Label htmlFor="c-active" className="text-xs font-medium cursor-pointer">
              Active immediately
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : "Save Coupon"}
            </Button>
          </div>
        </form>
      )}

      {/* Mobile Card View (< md) */}
      <div className="space-y-3 md:hidden">
        {coupons.map((c) => (
          <div key={c.id} className="rounded-2xl border bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 font-mono font-bold text-foreground text-sm">
                <Tag className="size-4 text-primary shrink-0" />
                <span className="tracking-wider">{c.code}</span>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  c.isActive
                    ? "bg-emerald-500/10 text-emerald-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {c.isActive ? "Active" : "Disabled"}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-primary">
                {c.type === "percentage" ? `${c.value}% OFF` : `${formatINR(c.value)} OFF`}
              </span>
              {c.minOrderAmount > 0 ? (
                <span className="text-xs text-muted-foreground">
                  min. {formatINR(c.minOrderAmount)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">No minimum</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
              <span>
                Uses: <strong className="text-foreground">{c.usageCount}</strong> {c.usageLimit ? `/ ${c.usageLimit}` : "times"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
                onClick={() => handleDelete(c.code)}
                aria-label={`Delete ${c.code}`}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          </div>
        ))}
        {coupons.length === 0 && (
          <div className="p-8 text-center text-xs text-muted-foreground border rounded-2xl bg-card">
            No coupons created yet.
          </div>
        )}
      </div>

      {/* Desktop Coupons Table (>= md) */}
      <div className="hidden md:block rounded-3xl border bg-card overflow-hidden shadow-xs">
        {coupons.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Min Order</th>
                <th className="p-4">Uses</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground flex items-center gap-1.5">
                    <Tag className="size-3.5 text-primary" /> {c.code}
                  </td>
                  <td className="p-4 font-semibold text-foreground">
                    {c.type === "percentage" ? `${c.value}% off` : `${formatINR(c.value)} off`}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {c.minOrderAmount > 0 ? formatINR(c.minOrderAmount) : "No minimum"}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {c.usageCount} {c.usageLimit ? `/ ${c.usageLimit}` : "uses"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        c.isActive
                          ? "bg-emerald-500/10 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(c.code)}
                      aria-label={`Delete ${c.code}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-10 text-center text-xs text-muted-foreground">
            No coupons created yet.
          </div>
        )}
      </div>
    </div>
  );
}
