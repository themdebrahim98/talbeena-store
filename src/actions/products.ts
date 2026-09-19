"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminDb } from "@/lib/firebase/admin";
import type { Category, Product, ProductImage } from "@/types/firebase";
import { requireAdmin } from "@/queries/admin";
import { productSchema } from "@/validations/product";
import type { ActionState } from "@/actions/auth";

/** Static placeholder until the image-upload feature lands. */
const PLACEHOLDER_IMAGE = "/images/product-placeholder.svg";

function toIndexed(csv: string): Record<string, string> {
  const parts = csv
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return Object.fromEntries(parts.map((v, i) => [String(i), v]));
}

function flagsFrom(formData: FormData) {
  return {
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    isBestSeller: formData.get("isBestSeller") === "on",
    isNew: formData.get("isNew") === "on",
  };
}

// ─── Create ──────────────────────────────────────────────────────────────────
export async function createProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Admin access required." };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    sku: formData.get("sku"),
    categorySlug: formData.get("categorySlug"),
    description: formData.get("description"),
    ingredients: formData.get("ingredients") ?? "",
    tags: formData.get("tags") ?? "",
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") ?? "",
    weight: formData.get("weight"),
    unit: formData.get("unit"),
    stock: formData.get("stock"),
    lowStockThreshold: formData.get("lowStockThreshold") ?? 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const flags = flagsFrom(formData);

  const db = getAdminDb();
  const existing = await db.ref(`products/${data.slug}`).get();
  if (existing.exists()) {
    return { error: "A product with this slug already exists." };
  }

  const categorySnap = await db.ref(`categories/${data.categorySlug}`).get();
  const category = categorySnap.val() as Category | null;
  if (!category) {
    return { error: "Choose a valid category." };
  }

  const rawImageUrl = (formData.get("primaryImageUrl") as string | null)?.trim();
  const primaryImageUrl = rawImageUrl || PLACEHOLDER_IMAGE;

  const now = Date.now();
  const product: Product = {
    name: data.name,
    slug: data.slug,
    sku: data.sku,
    categoryId: data.categorySlug,
    categorySlug: data.categorySlug,
    categoryName: category.name,
    description: data.description,
    ingredients: toIndexed(data.ingredients),
    tags: toIndexed(data.tags),
    price: data.price,
    compareAtPrice: data.compareAtPrice,
    weight: data.weight,
    unit: data.unit,
    stock: data.stock,
    lowStockThreshold: data.lowStockThreshold,
    ...flags,
    primaryImageUrl,
    createdAt: now,
    updatedAt: now,
  };

  const updates: Record<string, unknown> = {
    [`products/${data.slug}`]: product,
    [`productIndex/byCategory/${data.categorySlug}/${data.slug}`]: true,
  };
  if (flags.isFeatured) updates[`productIndex/byFeatured/${data.slug}`] = true;
  if (flags.isBestSeller) updates[`productIndex/byBestSeller/${data.slug}`] = true;
  if (flags.isNew) updates[`productIndex/byNew/${data.slug}`] = true;

  const imgRef = db.ref("productImages").push();
  const image: ProductImage = {
    productId: data.slug,
    url: primaryImageUrl,
    alt: data.name,
    sortOrder: 1,
    isPrimary: true,
  };
  updates[`productImages/${imgRef.key}`] = image;

  try {
    await db.ref().update(updates);
  } catch {
    return { error: "Could not save the product. Try again." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products");
  redirect("/admin/products");
}

// ─── Update ──────────────────────────────────────────────────────────────────
export async function updateProductAction(
  slug: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Admin access required." };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug,
    sku: formData.get("sku"),
    categorySlug: formData.get("categorySlug"),
    description: formData.get("description"),
    ingredients: formData.get("ingredients") ?? "",
    tags: formData.get("tags") ?? "",
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") ?? "",
    weight: formData.get("weight"),
    unit: formData.get("unit"),
    stock: formData.get("stock"),
    lowStockThreshold: formData.get("lowStockThreshold") ?? 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const flags = flagsFrom(formData);

  const db = getAdminDb();
  const [productSnap, categorySnap] = await Promise.all([
    db.ref(`products/${slug}`).get(),
    db.ref(`categories/${data.categorySlug}`).get(),
  ]);
  const old = productSnap.val() as Product | null;
  if (!old) return { error: "Product not found." };
  const category = categorySnap.val() as Category | null;
  if (!category) return { error: "Choose a valid category." };

  const rawImageUrl = (formData.get("primaryImageUrl") as string | null)?.trim();
  const primaryImageUrl = rawImageUrl || old.primaryImageUrl || PLACEHOLDER_IMAGE;

  const product: Product = {
    ...old,
    name: data.name,
    slug,
    sku: data.sku,
    categoryId: data.categorySlug,
    categorySlug: data.categorySlug,
    categoryName: category.name,
    description: data.description,
    ingredients: toIndexed(data.ingredients),
    tags: toIndexed(data.tags),
    price: data.price,
    compareAtPrice: data.compareAtPrice,
    weight: data.weight,
    unit: data.unit,
    stock: data.stock,
    lowStockThreshold: data.lowStockThreshold,
    ...flags,
    primaryImageUrl,
    updatedAt: Date.now(),
  };

  const updates: Record<string, unknown> = { [`products/${slug}`]: product };
  if (old.categorySlug !== data.categorySlug) {
    updates[`productIndex/byCategory/${old.categorySlug}/${slug}`] = null;
    updates[`productIndex/byCategory/${data.categorySlug}/${slug}`] = true;
  }
  const flagNodes = [
    ["isFeatured", "byFeatured"],
    ["isBestSeller", "byBestSeller"],
    ["isNew", "byNew"],
  ] as const;
  for (const [flag, node] of flagNodes) {
    if (old[flag] !== flags[flag]) {
      updates[`productIndex/${node}/${slug}`] = flags[flag] ? true : null;
    }
  }

  try {
    await db.ref().update(updates);
  } catch {
    return { error: "Could not save the product. Try again." };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${slug}`);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  redirect("/admin/products");
}

// ─── Delete ──────────────────────────────────────────────────────────────────
export async function deleteProductAction(
  slug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Admin access required." };
  }

  const db = getAdminDb();
  const productSnap = await db.ref(`products/${slug}`).get();
  const product = productSnap.val() as Product | null;
  if (!product) return { ok: false, error: "Product not found." };

  const imagesSnap = await db
    .ref("productImages")
    .orderByChild("productId")
    .equalTo(slug)
    .get();
  const images = (imagesSnap.val() ?? {}) as Record<string, ProductImage>;

  const updates: Record<string, unknown> = {
    [`products/${slug}`]: null,
    [`productIndex/byCategory/${product.categorySlug}/${slug}`]: null,
    [`productIndex/byFeatured/${slug}`]: null,
    [`productIndex/byBestSeller/${slug}`]: null,
    [`productIndex/byNew/${slug}`]: null,
  };
  for (const id of Object.keys(images)) {
    updates[`productImages/${id}`] = null;
  }

  try {
    await db.ref().update(updates);
  } catch {
    return { ok: false, error: "Could not delete the product. Try again." };
  }

  revalidatePath("/admin/products");
  return { ok: true };
}
