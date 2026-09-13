import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { rtdbListToArray } from "@/lib/firebase/rtdb";
import { getSessionUser } from "@/lib/firebase/server";
import type {
  Address,
  Category,
  OrderItem,
  Order,
  Product,
  ProductImage,
  ProductVariant,
  UserProfile,
  CartItem,
  ProductReview,
} from "@/types/firebase";

export interface ShopUser {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: "customer" | "admin";
}

/**
 * Loads the signed-in user from the session cookie plus their RTDB profile.
 * Returns `null` when anonymous, expired or misconfigured so browse-only
 * pages never crash.
 */
export async function getShopUser(): Promise<ShopUser | null> {
  try {
    const session = await getSessionUser();
    if (!session) return null;

    let profile: UserProfile | null = null;
    if (isAdminConfigured()) {
      const snap = await getAdminDb().ref(`users/${session.uid}`).get();
      profile = (snap.val() as UserProfile | null) ?? null;
    }

    const role = session.isAdmin || profile?.role === "admin" ? "admin" : "customer";

    return {
      id: session.uid,
      email: session.email,
      fullName: profile?.fullName ?? null,
      phone: profile?.phone ?? null,
      role,
    };
  } catch {
    return null;
  }
}

export interface ShopCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
}

/** Active categories ordered for navigation. */
export async function getActiveCategories(): Promise<ShopCategory[]> {
  try {
    if (!isAdminConfigured()) return [];

    const snap = await getAdminDb()
      .ref("categories")
      .orderByChild("isActive")
      .equalTo(true)
      .get();
    const raw = snap.val() as Record<string, Category> | null;
    if (!raw) return [];

    return Object.entries(raw)
      .map(([id, c]) => ({
        id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        imageUrl: c.imageUrl,
        sort: c.sortOrder ?? 0,
      }))
      .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))
      .map(({ id, name, slug, description, imageUrl }) => ({
        id,
        name,
        slug,
        description,
        imageUrl,
      }));
  } catch {
    return [];
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    if (!isAdminConfigured()) return null;
    const snap = await getAdminDb().ref(`categories/${slug}`).get();
    const cat = snap.val() as Category | null;
    return cat ?? null;
  } catch {
    return null;
  }
}

export interface CatalogProduct {
  slug: string;
  name: string;
  sku: string;
  categorySlug: string;
  categoryName: string;
  description: string;
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
  primaryImageUrl: string;
  createdAt: number;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  sort?: "featured" | "price-asc" | "price-desc" | "newest";
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

export async function getProducts(filters: ProductFilters = {}): Promise<{
  products: CatalogProduct[];
  total: number;
}> {
  try {
    if (!isAdminConfigured()) return { products: [], total: 0 };

    const db = getAdminDb();
    const snap = await db.ref("products").get();
    const raw = snap.val() as Record<string, Product> | null;
    if (!raw) return { products: [], total: 0 };

    let items: CatalogProduct[] = Object.entries(raw)
      .filter(([, p]) => p.isActive !== false)
      .map(([slug, p]) => ({
        slug,
        name: p.name,
        sku: p.sku,
        categorySlug: p.categorySlug,
        categoryName: p.categoryName,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        weight: p.weight,
        unit: p.unit,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        isBestSeller: p.isBestSeller,
        isNew: p.isNew,
        primaryImageUrl: p.primaryImageUrl || "/images/product-placeholder.svg",
        createdAt: p.createdAt ?? 0,
      }));

    if (filters.category) {
      items = items.filter((p) => p.categorySlug === filters.category);
    }

    if (filters.search) {
      const q = filters.search.trim().toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q),
      );
    }

    if (typeof filters.minPrice === "number") {
      items = items.filter((p) => p.price >= filters.minPrice!);
    }

    if (typeof filters.maxPrice === "number") {
      items = items.filter((p) => p.price <= filters.maxPrice!);
    }

    // Sorting
    switch (filters.sort) {
      case "price-asc":
        items.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        items.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        items.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case "featured":
      default:
        items.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          if (a.isBestSeller && !b.isBestSeller) return -1;
          if (!a.isBestSeller && b.isBestSeller) return 1;
          return a.name.localeCompare(b.name);
        });
        break;
    }

    const total = items.length;
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 50;
    const paginated = items.slice(offset, offset + limit);

    return { products: paginated, total };
  } catch {
    return { products: [], total: 0 };
  }
}

export interface ProductDetailData {
  product: Product;
  images: Array<{ id: string } & ProductImage>;
  variants: Array<{ id: string } & ProductVariant>;
  ingredientsList: string[];
  tagsList: string[];
}

export async function getProductBySlug(slug: string): Promise<ProductDetailData | null> {
  try {
    if (!isAdminConfigured()) return null;
    const db = getAdminDb();

    const [productSnap, imagesSnap, variantsSnap] = await Promise.all([
      db.ref(`products/${slug}`).get(),
      db.ref("productImages").orderByChild("productId").equalTo(slug).get(),
      db.ref("productVariants").orderByChild("productId").equalTo(slug).get(),
    ]);

    const product = productSnap.val() as Product | null;
    if (!product || !product.isActive) return null;

    const rawImages = (imagesSnap.val() ?? {}) as Record<string, ProductImage>;
    const images = Object.entries(rawImages)
      .map(([id, img]) => ({ id, ...img }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // If no explicit productImages records, provide primary image
    if (images.length === 0 && product.primaryImageUrl) {
      images.push({
        id: "primary",
        productId: slug,
        url: product.primaryImageUrl,
        alt: product.name,
        sortOrder: 1,
        isPrimary: true,
      });
    }

    const rawVariants = (variantsSnap.val() ?? {}) as Record<string, ProductVariant>;
    const variants = Object.entries(rawVariants)
      .map(([id, v]) => ({ id, ...v }))
      .filter((v) => v.isActive !== false);

    return {
      product,
      images,
      variants,
      ingredientsList: rtdbListToArray(product.ingredients),
      tagsList: rtdbListToArray(product.tags),
    };
  } catch {
    return null;
  }
}

export async function getRelatedProducts(
  categorySlug: string,
  excludeSlug: string,
  limit = 4,
): Promise<CatalogProduct[]> {
  const { products } = await getProducts({ category: categorySlug, limit: 10 });
  return products.filter((p) => p.slug !== excludeSlug).slice(0, limit);
}

export async function getUserAddresses(uid: string): Promise<Array<Address & { id: string }>> {
  try {
    if (!isAdminConfigured()) return [];
    const snap = await getAdminDb().ref(`addresses/${uid}`).get();
    const raw = snap.val() as Record<string, Address> | null;
    if (!raw) return [];

    return Object.entries(raw)
      .map(([id, addr]) => ({ id, ...addr }))
      .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0) || b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function getUserOrders(uid: string): Promise<Array<Order & { id: string; itemCount?: number }>> {
  try {
    if (!isAdminConfigured()) return [];
    const db = getAdminDb();
    let raw: Record<string, Order> | null = null;

    try {
      const snap = await db.ref("orders").orderByChild("userId").equalTo(uid).get();
      raw = snap.val() as Record<string, Order> | null;
    } catch {
      // Fallback: in-memory filter if indexing query encounters an issue
      const allSnap = await db.ref("orders").get();
      const all = (allSnap.val() ?? {}) as Record<string, Order>;
      raw = Object.fromEntries(
        Object.entries(all).filter(([, o]) => o.userId === uid),
      );
    }

    if (!raw) return [];

    const orders = Object.entries(raw).map(([id, o]) => ({ id, ...o }));
    orders.sort((a, b) => b.createdAt - a.createdAt);
    return orders;
  } catch (err) {
    console.error("Failed to fetch user orders:", err);
    return [];
  }
}

export interface OrderDetailWithItems {
  order: Order & { id: string };
  items: Array<OrderItem & { id: string }>;
}

export async function getOrderById(orderId: string, uid?: string): Promise<OrderDetailWithItems | null> {
  try {
    if (!isAdminConfigured()) return null;
    const db = getAdminDb();

    const [orderSnap, itemsSnap] = await Promise.all([
      db.ref(`orders/${orderId}`).get(),
      db.ref(`orderItems/${orderId}`).get(),
    ]);

    const order = orderSnap.val() as Order | null;
    if (!order) return null;

    if (uid && order.userId !== uid) {
      return null;
    }

    const rawItems = (itemsSnap.val() ?? {}) as Record<string, OrderItem>;
    const items = Object.entries(rawItems).map(([id, item]) => ({ id, ...item }));

    return {
      order: { id: orderId, ...order },
      items,
    };
  } catch {
    return null;
  }
}

export async function getUserWishlist(uid: string): Promise<CatalogProduct[]> {
  try {
    if (!isAdminConfigured()) return [];
    const db = getAdminDb();
    const snap = await db.ref(`wishlist/${uid}/products`).get();
    const raw = snap.val() as Record<string, boolean> | null;
    if (!raw) return [];

    const productIds = Object.keys(raw).filter((id) => raw[id]);
    if (productIds.length === 0) return [];

    const { products } = await getProducts({ limit: 1000 });
    const idSet = new Set(productIds);
    return products.filter((p) => idSet.has(p.slug));
  } catch {
    return [];
  }
}

export async function getUserCart(uid: string): Promise<Array<CartItem & { id: string }>> {
  try {
    if (!isAdminConfigured()) return [];
    const snap = await getAdminDb().ref(`carts/${uid}/items`).get();
    const raw = snap.val() as Record<string, CartItem> | null;
    if (!raw) return [];

    return Object.entries(raw).map(([id, item]) => ({ id, ...item }));
  } catch {
    return [];
  }
}

export interface ProductReviewsSummary {
  reviews: ProductReview[];
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export async function getProductReviews(productId: string): Promise<ProductReviewsSummary> {
  const empty: ProductReviewsSummary = {
    reviews: [],
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };

  try {
    if (!isAdminConfigured()) return empty;
    const snap = await getAdminDb().ref(`reviews/${productId}`).get();
    if (!snap.exists()) return empty;

    const raw = snap.val() as Record<string, ProductReview>;
    const reviews = Object.values(raw)
      .filter((r) => r.status === "APPROVED")
      .sort((a, b) => b.createdAt - a.createdAt);

    if (reviews.length === 0) return empty;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let ratingSum = 0;

    for (const r of reviews) {
      ratingSum += r.rating;
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      distribution[rounded]++;
    }

    const averageRating = Number((ratingSum / reviews.length).toFixed(1));

    return {
      reviews,
      averageRating,
      totalReviews: reviews.length,
      distribution,
    };
  } catch {
    return empty;
  }
}

export async function checkCustomerPurchasedProduct(
  userId: string,
  productId: string,
): Promise<boolean> {
  try {
    if (!isAdminConfigured() || !userId) return false;
    const db = getAdminDb();
    const ordersSnap = await db
      .ref("orders")
      .orderByChild("userId")
      .equalTo(userId)
      .get();

    if (!ordersSnap.exists()) return false;

    const orders = ordersSnap.val() as Record<string, Order>;
    for (const [orderId, order] of Object.entries(orders)) {
      if (order.status === "DELIVERED" || order.status === "CONFIRMED") {
        const itemsSnap = await db.ref(`orderItems/${orderId}`).get();
        const items = (itemsSnap.val() ?? {}) as Record<string, OrderItem>;
        if (Object.values(items).some((it) => it.productId === productId)) {
          return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

export async function getUserProductReviews(
  userId: string,
  productIds: string[],
): Promise<Record<string, ProductReview>> {
  try {
    if (!isAdminConfigured() || !userId || productIds.length === 0) return {};
    const db = getAdminDb();
    const result: Record<string, ProductReview> = {};

    await Promise.all(
      productIds.map(async (productId) => {
        const snap = await db.ref(`reviews/${productId}`).get();
        if (snap.exists()) {
          const raw = snap.val() as Record<string, ProductReview>;
          const userRev = Object.values(raw).find(
            (r) => r.userId === userId && r.status === "APPROVED",
          );
          if (userRev) {
            result[productId] = userRev;
          }
        }
      }),
    );

    return result;
  } catch {
    return {};
  }
}

export { rtdbListToArray };