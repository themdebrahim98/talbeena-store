"use client";

import { useState } from "react";
import { Check, MapPin, Plus, Trash2, Home } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { toast } from "@/components/primitives/toast";
import {
  saveAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/actions/address";
import type { Address } from "@/types/firebase";

interface AddressManagerProps {
  initialAddresses: Array<Address & { id: string }>;
}

export function AddressManager({ initialAddresses }: AddressManagerProps) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await saveAddressAction({
        ...formData,
        country: "India",
      });

      if (res.success && res.addressId) {
        toast.success("Address saved successfully");
        setShowForm(false);
        setAddresses((prev) => [
          ...prev.map((a) => (formData.isDefault ? { ...a, isDefault: false } : a)),
          {
            id: res.addressId!,
            ...formData,
            country: "India",
            createdAt: Date.now(),
          },
        ]);
        setFormData({
          name: "",
          phone: "",
          line1: "",
          line2: "",
          city: "",
          state: "",
          pincode: "",
          isDefault: false,
        });
      } else {
        toast.error(res.error || "Failed to save address");
      }
    } catch {
      toast.error("Error saving address");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    const res = await deleteAddressAction(id);
    if (res.success) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.info("Address deleted");
    } else {
      toast.error(res.error || "Failed to delete address");
    }
  };

  const handleSetDefault = async (id: string) => {
    const res = await setDefaultAddressAction(id);
    if (res.success) {
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id })),
      );
      toast.success("Default address updated");
    } else {
      toast.error(res.error || "Failed to set default address");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Saved Addresses</h2>
          <p className="text-sm text-muted-foreground">
            Manage your delivery destinations for quick and easy checkout.
          </p>
        </div>

        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
            <Plus className="size-4" /> Add New Address
          </Button>
        )}
      </div>

      {/* Add New Address Form Modal/Panel */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="rounded-3xl border bg-card p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-sm">New Delivery Address</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Contact Person *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full Name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                required
                maxLength={10}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="10-digit mobile number"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="line1">Flat / House no. / Street *</Label>
            <Input
              id="line1"
              required
              value={formData.line1}
              onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
              placeholder="e.g. 102, Sunrise Apts, MG Road"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="line2">Landmark / Colony (Optional)</Label>
            <Input
              id="line2"
              value={formData.line2}
              onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
              placeholder="Near Central Park"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pincode">PIN Code *</Label>
              <Input
                id="pincode"
                required
                maxLength={6}
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="6-digit PIN"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="rounded border-input text-primary focus:ring-primary size-4"
            />
            <Label htmlFor="isDefault" className="text-xs font-medium cursor-pointer">
              Make this my default shipping address
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : "Save Address"}
            </Button>
          </div>
        </form>
      )}

      {/* Address cards */}
      {addresses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="flex flex-col justify-between rounded-3xl border bg-card p-5 shadow-xs space-y-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <MapPin className="size-4 text-primary" /> {addr.name}
                  </span>
                  {addr.isDefault && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{addr.phone}</p>
                <p className="text-xs text-foreground/90 mt-1">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ""}
                  <br />
                  {addr.city}, {addr.state} — {addr.pincode}
                </p>
              </div>

              <div className="flex items-center justify-between border-t pt-3 text-xs">
                {!addr.isDefault ? (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-primary hover:underline font-medium"
                  >
                    Set as default
                  </button>
                ) : (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Check className="size-3.5 text-primary" /> Default
                  </span>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(addr.id)}
                  aria-label="Delete address"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="rounded-3xl border border-dashed p-8 text-center space-y-3">
            <Home className="size-8 mx-auto text-muted-foreground/60" />
            <p className="text-sm font-semibold">No addresses saved</p>
            <p className="text-xs text-muted-foreground">
              Add your home or office address to speed up future checkouts.
            </p>
            <Button size="sm" onClick={() => setShowForm(true)}>
              Add Address
            </Button>
          </div>
        )
      )}
    </div>
  );
}
