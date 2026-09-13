"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Banknote, CreditCard, Lock, Plus, ShieldCheck } from "lucide-react";

import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { toast } from "@/components/primitives/toast";
import { EmptyState } from "@/components/shared/empty-state";
import { formatINR } from "@/lib/format";
import { computeShipping } from "@/lib/shipping";
import { createOrderAction, verifyRazorpayPaymentAction } from "@/actions/checkout";
import type { Address } from "@/types/firebase";
import type { CatalogProduct, ShopUser } from "@/queries/shop";

interface CheckoutFormProps {
  user: ShopUser | null;
  savedAddresses: Array<Address & { id: string }>;
  products: CatalogProduct[];
  initialCoupon?: string;
}

export function CheckoutForm({
  user,
  savedAddresses,
  products,
  initialCoupon,
}: CheckoutFormProps) {
  const router = useRouter();
  const { lines, clearCart, count } = useCart();
  const [submitting, setSubmitting] = useState(false);

  // Address state
  const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddr ? defaultAddr.id : "new",
  );

  const [newAddress, setNewAddress] = useState<Address>({
    name: user?.fullName || "Md Ebrahim",
    phone: user?.phone || "6303590387",
    line1: "",
    line2: null,
    city: "",
    state: "",
    pincode: "",
    country: "India",
    isDefault: false,
    createdAt: 0,
  });

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">("cod");
  const [customerNote, setCustomerNote] = useState("");

  const productsMap = new Map<string, CatalogProduct>(
    products.map((p) => [p.slug, p]),
  );

  const cartItems = lines
    .map((line) => {
      const product = productsMap.get(line.productId);
      if (!product) return null;
      return {
        ...line,
        product,
        lineTotal: product.price * line.quantity,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.lineTotal, 0);
  const discountAmount = initialCoupon === "WELCOME10" ? Math.round(subtotal * 0.1) : 0;
  const shipping = computeShipping(subtotal);
  const total = Math.max(0, subtotal - discountAmount + shipping);

  if (count === 0 || cartItems.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Please add items to your cart before proceeding to checkout."
        actionHref="/products"
        actionLabel="Browse Products"
      />
    );
  }

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      // @ts-expect-error Razorpay global check
      if (window.Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let finalAddress: Address;
    if (selectedAddressId !== "new") {
      const found = savedAddresses.find((a) => a.id === selectedAddressId);
      if (!found) {
        toast.error("Please select a valid address.");
        setSubmitting(false);
        return;
      }
      finalAddress = found;
    } else {
      if (!newAddress.name || !newAddress.phone || !newAddress.line1 || !newAddress.city || !newAddress.pincode) {
        toast.error("Please fill in all required address fields.");
        setSubmitting(false);
        return;
      }
      if (!/^[6-9]\d{9}$/.test(newAddress.phone)) {
        toast.error("Please enter a valid 10-digit Indian phone number.");
        setSubmitting(false);
        return;
      }
      if (!/^\d{6}$/.test(newAddress.pincode)) {
        toast.error("Please enter a valid 6-digit Indian PIN code.");
        setSubmitting(false);
        return;
      }
      finalAddress = newAddress;
    }

    try {
      const res = await createOrderAction({
        items: cartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        address: finalAddress,
        paymentMethod,
        couponCode: initialCoupon || null,
        customerNote: customerNote || null,
      });

      if (!res.success || !res.orderId) {
        toast.error(res.error || "Failed to create order");
        setSubmitting(false);
        return;
      }

      // COD Flow
      if (paymentMethod === "cod") {
        clearCart();
        toast.success("Order confirmed successfully!");
        router.push(`/checkout/success?orderId=${res.orderId}`);
        return;
      }

      // Razorpay Flow
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Could not load Razorpay payment gateway. Please try Cash on Delivery.");
        setSubmitting(false);
        return;
      }

      const options = {
        key: res.keyId,
        amount: Math.round((res.amount || total) * 100),
        currency: res.currency || "INR",
        name: "Talbeena",
        description: `Order #${res.orderId.slice(-6)}`,
        order_id: res.razorpayOrderId,
        prefill: {
          name: finalAddress.name,
          contact: (finalAddress.phone || "6303590387").replace(/\D/g, "").slice(-10),
          email: user?.email || "customer@talbeena.in",
        },
        theme: {
          color: "#2d5a27",
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          const verifyRes = await verifyRazorpayPaymentAction({
            orderId: res.orderId!,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });

          if (verifyRes.success) {
            clearCart();
            toast.success("Payment verified and order confirmed!");
            router.push(`/checkout/success?orderId=${res.orderId}`);
          } else {
            toast.error(verifyRes.error || "Payment verification failed.");
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            toast.info("Payment cancelled. You can retry anytime.");
            setSubmitting(false);
          },
        },
      };

      // @ts-expect-error Global Razorpay instance
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Checkout error");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitOrder} className="grid gap-10 lg:grid-cols-12 lg:items-start">
      {/* Checkout Form Inputs */}
      <div className="space-y-8 lg:col-span-7">
        {/* Step 1: Delivery Address */}
        <div className="rounded-3xl border bg-card p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b pb-4">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            <h2 className="text-lg font-bold tracking-tight">Delivery Address</h2>
          </div>

          {/* Saved addresses selector */}
          {savedAddresses.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {savedAddresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "hover:border-foreground/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{addr.name}</p>
                      {addr.isDefault && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {addr.line1}, {addr.city} {addr.pincode}
                    </p>
                    <p className="text-xs text-foreground font-medium mt-1">
                      {addr.phone}
                    </p>
                  </div>
                );
              })}

              <div
                onClick={() => setSelectedAddressId("new")}
                className={`flex cursor-pointer items-center justify-center rounded-2xl border border-dashed p-4 transition text-sm font-medium ${
                  selectedAddressId === "new"
                    ? "border-primary bg-primary/5 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Plus className="size-4 mr-1.5" /> Enter new address
              </div>
            </div>
          )}

          {/* New address form */}
          {(selectedAddressId === "new" || savedAddresses.length === 0) && (
            <div className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    required
                    value={newAddress.name}
                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                    placeholder="Recipient's full name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Mobile Phone *</Label>
                  <Input
                    id="phone"
                    required
                    maxLength={10}
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="line1">Flat / House no. / Street *</Label>
                <Input
                  id="line1"
                  required
                  value={newAddress.line1}
                  onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                  placeholder="e.g. Flat 302, Green Meadows"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="line2">Landmark / Area (Optional)</Label>
                <Input
                  id="line2"
                  value={newAddress.line2 || ""}
                  onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                  placeholder="Near City Hospital"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="city">City / District *</Label>
                  <Input
                    id="city"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    required
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pincode">PIN Code *</Label>
                  <Input
                    id="pincode"
                    required
                    maxLength={6}
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                    placeholder="6-digit PIN"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Payment Method */}
        <div className="rounded-3xl border bg-card p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b pb-4">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </span>
            <h2 className="text-lg font-bold tracking-tight">Payment Method</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* COD Option */}
            <div
              onClick={() => setPaymentMethod("cod")}
              className={`cursor-pointer rounded-2xl border p-4 transition flex items-start gap-3 ${
                paymentMethod === "cod"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "hover:border-foreground/30"
              }`}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Banknote className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-sm">Cash on Delivery (COD)</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pay with cash or UPI when your parcel arrives.
                </p>
              </div>
            </div>

            {/* Razorpay Option */}
            <div
              onClick={() => setPaymentMethod("razorpay")}
              className={`cursor-pointer rounded-2xl border p-4 transition flex items-start gap-3 ${
                paymentMethod === "razorpay"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "hover:border-foreground/30"
              }`}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <CreditCard className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-sm">Online Payment</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  UPI, Cards, NetBanking via Razorpay.
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Instructions */}
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="note">Delivery Note / Instructions (Optional)</Label>
            <Input
              id="note"
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="e.g. Leave with security, call upon arrival"
            />
          </div>
        </div>
      </div>

      {/* Order Summary Column */}
      <div className="space-y-6 lg:col-span-5">
        <div className="rounded-3xl border bg-card p-6 shadow-xs space-y-6 sticky top-24">
          <h2 className="text-lg font-bold tracking-tight">Your Order ({count} items)</h2>

          {/* Items mini list */}
          <div className="max-h-60 overflow-y-auto divide-y pr-1 space-y-2">
            {cartItems.map(({ product, quantity, lineTotal }) => (
              <div key={product.slug} className="flex items-center gap-3 pt-2 first:pt-0">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border bg-muted/40">
                  <Image
                    src={product.primaryImageUrl || "/images/product-placeholder.svg"}
                    alt={product.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-semibold">{product.name}</p>
                  <p className="text-[11px] text-muted-foreground">Qty: {quantity}</p>
                </div>
                <span className="text-xs font-bold text-foreground">
                  {formatINR(lineTotal)}
                </span>
              </div>
            ))}
          </div>

          {/* Cost breakdown */}
          <div className="space-y-2.5 text-sm border-t pt-4">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="text-foreground font-medium">{formatINR(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Coupon ({initialCoupon})</span>
                <span>-{formatINR(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Fee</span>
              <span>{shipping === 0 ? "FREE" : formatINR(shipping)}</span>
            </div>

            <div className="flex justify-between border-t pt-3 text-base font-bold text-foreground">
              <span>Grand Total</span>
              <span className="text-2xl text-primary">{formatINR(total)}</span>
            </div>
          </div>

          {/* Submit CTA */}
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full gap-2 text-base shadow-sm font-semibold"
          >
            <Lock className="size-4" />
            {submitting
              ? "Placing Order…"
              : paymentMethod === "cod"
              ? `Confirm COD Order (${formatINR(total)})`
              : `Pay with Razorpay (${formatINR(total)})`}
          </Button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            <span>256-bit encrypted checkout. Your data is safe.</span>
          </div>
        </div>
      </div>
    </form>
  );
}
