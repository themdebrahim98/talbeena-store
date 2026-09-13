import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { rtdbListToArray } from "@/lib/firebase/rtdb";
import type {
  Category,
  Coupon,
  Order,
  OrderItem,
  Payment,
  Product,
  ProductImage,
  UserProfile,
} from "@/types/firebase";

import { getShopUser, type ShopUser } from "@/queries/shop";

/** Throw unless the caller is a signed-in admin (server actions + guards). */
export async function requireAdmin(): Promise<ShopUser> {
  const user = await getShopUser();
  if (!user || user.role !== "admin") {
    throw new Error("Admin access required.");
  }
  return user;
}

export interface AdminCategory {
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

/** Every category (active + inactive) for admin selects, ordered. */
export async function getAllCategories(): Promise<AdminCategory[]> {
  if (!isAdminConfigured()) return [];
  try {
    const snap = await getAdminDb().ref("categories").get();
    const raw = snap.val() as Record<string, Category> | null;
    if (!raw) return [];
    return Object.values(raw)
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.description ?? null,
        imageUrl: c.imageUrl ?? null,
        isActive: c.isActive,
        sortOrder: c.sortOrder ?? 0,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export interface AdminProductRow {
  slug: string;
  name: string;
  sku: string;
  categorySlug: string;
  categoryName: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  primaryImageUrl: string | null;
  updatedAt: number;
}

/** Every product for the admin list, newest activity first. */
export async function getAdminProducts(): Promise<AdminProductRow[]> {
  if (!isAdminConfigured()) return [];
  try {
    const snap = await getAdminDb().ref("products").get();
    const raw = snap.val() as Record<string, Product> | null;
    if (!raw) return [];
    return Object.entries(raw)
      .map(([slug, p]) => ({
        slug,
        name: p.name,
        sku: p.sku,
        categorySlug: p.categorySlug,
        categoryName: p.categoryName,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        isBestSeller: p.isBestSeller,
        isNew: p.isNew,
        primaryImageUrl: p.primaryImageUrl ?? null,
        updatedAt: p.updatedAt ?? 0,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt || a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export interface AdminProductDetail {
  product: Product;
  images: Array<{ id: string } & ProductImage>;
  ingredientsText: string;
  tagsText: string;
}

/** Single product + its images for the edit page. */
export async function getAdminProduct(
  slug: string,
): Promise<AdminProductDetail | null> {
  if (!isAdminConfigured()) return null;
  try {
    const db = getAdminDb();
    const [productSnap, imagesSnap] = await Promise.all([
      db.ref(`products/${slug}`).get(),
      db.ref("productImages").orderByChild("productId").equalTo(slug).get(),
    ]);
    const product = productSnap.val() as Product | null;
    if (!product) return null;

    const rawImages = (imagesSnap.val() ?? {}) as Record<string, ProductImage>;
    const images = Object.entries(rawImages)
      .map(([id, img]) => ({ id, ...img }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      product,
      images,
      ingredientsText: rtdbListToArray(product.ingredients).join(", "),
      tagsText: rtdbListToArray(product.tags).join(", "),
    };
  } catch {
    return null;
  }
}

export interface AdminDashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockCount: number;
  recentOrders: Array<Order & { id: string }>;
  lowStockProducts: AdminProductRow[];
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  if (!isAdminConfigured()) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      lowStockCount: 0,
      recentOrders: [],
      lowStockProducts: [],
    };
  }

  try {
    const db = getAdminDb();
    const [ordersSnap, productsSnap, usersSnap] = await Promise.all([
      db.ref("orders").get(),
      db.ref("products").get(),
      db.ref("users").get(),
    ]);

    const rawOrders = (ordersSnap.val() ?? {}) as Record<string, Order>;
    const rawProducts = (productsSnap.val() ?? {}) as Record<string, Product>;
    const rawUsers = (usersSnap.val() ?? {}) as Record<string, UserProfile>;

    const orders = Object.entries(rawOrders).map(([id, o]) => ({ id, ...o }));
    orders.sort((a, b) => b.createdAt - a.createdAt);

    const validPaidOrders = orders.filter(
      (o) => o.status !== "CANCELLED" && o.status !== "FAILED",
    );
    const totalRevenue = validPaidOrders.reduce((acc, o) => acc + (o.total || 0), 0);

    const allProducts = Object.entries(rawProducts).map(([slug, p]) => ({
      slug,
      name: p.name,
      sku: p.sku,
      categorySlug: p.categorySlug,
      categoryName: p.categoryName,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      stock: p.stock,
      lowStockThreshold: p.lowStockThreshold,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      isBestSeller: p.isBestSeller,
      isNew: p.isNew,
      primaryImageUrl: p.primaryImageUrl ?? null,
      updatedAt: p.updatedAt ?? 0,
    }));

    const lowStockProducts = allProducts.filter((p) => p.stock <= p.lowStockThreshold);

    return {
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: allProducts.length,
      totalCustomers: Object.keys(rawUsers).length,
      lowStockCount: lowStockProducts.length,
      recentOrders: orders.slice(0, 6),
      lowStockProducts: lowStockProducts.slice(0, 5),
    };
  } catch {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      lowStockCount: 0,
      recentOrders: [],
      lowStockProducts: [],
    };
  }
}

export interface AdminOrderListItem extends Order {
  id: string;
}

export async function getAdminOrders(statusFilter?: string): Promise<AdminOrderListItem[]> {
  if (!isAdminConfigured()) return [];
  try {
    const snap = await getAdminDb().ref("orders").get();
    const raw = snap.val() as Record<string, Order> | null;
    if (!raw) return [];

    let orders = Object.entries(raw).map(([id, o]) => ({ id, ...o }));
    if (statusFilter && statusFilter !== "ALL") {
      orders = orders.filter((o) => o.status === statusFilter);
    }
    orders.sort((a, b) => b.createdAt - a.createdAt);
    return orders;
  } catch {
    return [];
  }
}

export interface AdminOrderDetailFull {
  order: Order & { id: string };
  items: Array<OrderItem & { id: string }>;
  payment: (Payment & { id: string }) | null;
}

export async function getAdminOrderDetail(orderId: string): Promise<AdminOrderDetailFull | null> {
  if (!isAdminConfigured()) return null;
  try {
    const db = getAdminDb();
    const [orderSnap, itemsSnap, paymentsSnap] = await Promise.all([
      db.ref(`orders/${orderId}`).get(),
      db.ref(`orderItems/${orderId}`).get(),
      db.ref("payments").orderByChild("orderId").equalTo(orderId).get(),
    ]);

    const order = orderSnap.val() as Order | null;
    if (!order) return null;

    const rawItems = (itemsSnap.val() ?? {}) as Record<string, OrderItem>;
    const items = Object.entries(rawItems).map(([id, item]) => ({ id, ...item }));

    const rawPayments = (paymentsSnap.val() ?? {}) as Record<string, Payment>;
    const paymentEntry = Object.entries(rawPayments)[0];
    const payment = paymentEntry ? { id: paymentEntry[0], ...paymentEntry[1] } : null;

    return {
      order: { id: orderId, ...order },
      items,
      payment,
    };
  } catch {
    return null;
  }
}

export interface AdminCustomerRow {
  uid: string;
  email?: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: number;
}

export async function getAdminCustomers(): Promise<AdminCustomerRow[]> {
  if (!isAdminConfigured()) return [];
  try {
    const snap = await getAdminDb().ref("users").get();
    const raw = snap.val() as Record<string, UserProfile> | null;
    if (!raw) return [];

    return Object.entries(raw)
      .map(([uid, u]) => ({
        uid,
        fullName: u.fullName ?? null,
        phone: u.phone ?? null,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt ?? 0,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export interface AdminCouponRow extends Coupon {
  id: string;
}

export async function getAdminCoupons(): Promise<AdminCouponRow[]> {
  if (!isAdminConfigured()) return [];
  try {
    const snap = await getAdminDb().ref("coupons").get();
    const raw = snap.val() as Record<string, Coupon> | null;
    if (!raw) return [];

    return Object.entries(raw)
      .map(([id, c]) => ({ ...c, id: c.id || id }))
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}
