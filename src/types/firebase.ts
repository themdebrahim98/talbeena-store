// Realtime Database node types. camelCase by convention; money is stored in
// INR (decimals, e.g. 399.00) and timestamps are millis since epoch.

import type { CouponRecord } from "@/lib/coupons";

export type Role = "customer" | "admin";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"
  | "FAILED"
  | "RETURN_REQUESTED"
  | "RETURN_APPROVED"
  | "RETURN_REJECTED";

export type PaymentMethod = "razorpay" | "cod";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "COD";
export type CouponType = "percentage" | "fixed";

/** `/users/{uid}` — profile + role, created on registration. */
export interface UserProfile {
  fullName: string | null;
  phone: string | null;
  role: Role;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: number;
  updatedAt: number;
}

/** `/categories/{id}` */
export interface Category {
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
}

/** `/products/{id}` — denormalised for single-read listing. */
export interface Product {
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  description: string;
  ingredients: string[] | Record<string, string>;
  tags: string[] | Record<string, string>;
  price: number;
  compareAtPrice: number | null;
  weight: number;
  unit: string;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  primaryImageUrl: string | null;
  createdAt: number;
  updatedAt: number;
}

/** `/productImages/{id}` */
export interface ProductImage {
  productId: string;
  url: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
  /** Local path under `public/uploads` for admin-uploaded files (absent for placeholders). */
  storagePath?: string | null;
}

/** `/productVariants/{id}` */
export interface ProductVariant {
  productId: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  weight: number;
  isActive: boolean;
}

/** `/carts/{uid}/items/{productId}_{variantId}` */
export interface CartItem {
  productId: string;
  variantId: string | null;
  quantity: number;
  name: string;
  price: number;
  imageUrl: string | null;
  sku: string;
}

/** `/addresses/{uid}/{addressId}` */
export interface Address {
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  createdAt: number;
}

/** `/orders/{id}` — address snapshot + totals stored inline. */
export interface Order {
  userId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  addressName: string;
  addressPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  addressCity: string;
  addressState: string;
  addressPincode: string;
  addressCountry: string;
  subtotal: number;
  discount: number;
  couponId: string | null;
  couponCode: string | null;
  shipping: number;
  total: number;
  createdAt: number;
  updatedAt: number;
  returnReason?: string | null;
  returnComments?: string | null;
  returnRequestedAt?: number | null;
  refundId?: string | null;
  refundAmount?: number | null;
  refundedAt?: number | null;
  adminNotes?: string | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shippedAt?: number | null;
  estimatedDeliveryAt?: number | null;
}

/** `/reviews/{productId}/{reviewId}` */
export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  status: "APPROVED" | "PENDING" | "REJECTED";
  createdAt: number;
  updatedAt: number;
}

/** `/orderItems/{orderId}/{itemId}` */
export interface OrderItem {
  productId: string;
  variantId: string | null;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  total: number;
  weight: number;
}

/** `/coupons/{code}` — keyed by uppercase code for O(1) lookup. */
export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  perUserLimit: number;
  usageLimit: number | null;
  usageCount: number;
  startsAt: number | null;
  expiresAt: number | null;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/** `/reviews/{id}` */
export interface Review {
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string | null;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: number;
  updatedAt: number;
}

/** `/payments/{id}` */
export interface Payment {
  orderId: string;
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  method: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: number;
  updatedAt: number;
}

/** `/newsletters/{sanitisedEmail}` */
export interface NewsletterSignup {
  email: string;
  subscribedAt: number;
}

/**
 * Adapt an RTDB coupon to the pure `CouponRecord` shape used by
 * `src/lib/coupons.ts` (ISO date strings, snake_case).
 */
export function couponToRecord(coupon: Coupon): CouponRecord {
  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    min_order_amount: coupon.minOrderAmount,
    max_discount: coupon.maxDiscount,
    per_user_limit: coupon.perUserLimit,
    usage_limit: coupon.usageLimit,
    starts_at: coupon.startsAt ? new Date(coupon.startsAt).toISOString() : null,
    expires_at: coupon.expiresAt
      ? new Date(coupon.expiresAt).toISOString()
      : null,
    is_active: coupon.isActive,
  };
}