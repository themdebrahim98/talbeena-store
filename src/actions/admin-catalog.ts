"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/queries/admin";
import { categorySchema, type CategoryInput } from "@/validations/category";
import { couponSchema, type CouponInput } from "@/validations/coupon";
import type { Category, Coupon } from "@/types/firebase";

export async function saveCategoryAction(
  data: CategoryInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const parsed = categorySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const db = getAdminDb();
    const { slug, name, description, imageUrl, sortOrder, isActive } = parsed.data;

    const categoryRecord: Category = {
      name,
      slug,
      description: description ?? null,
      imageUrl: imageUrl ?? null,
      parentId: null,
      sortOrder,
      isActive,
    };

    await db.ref(`categories/${slug}`).set(categoryRecord);

    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath("/products");

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save category" };
  }
}

export async function deleteCategoryAction(
  slug: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const db = getAdminDb();
    await db.ref(`categories/${slug}`).remove();

    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath("/products");

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete category" };
  }
}

export async function saveCouponAction(
  data: CouponInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const parsed = couponSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const db = getAdminDb();
    const now = Date.now();
    const code = parsed.data.code.toUpperCase();

    const existingSnap = await db.ref(`coupons/${code}`).get();
    const existing = existingSnap.val() as Coupon | null;

    const couponRecord: Coupon = {
      id: code,
      code,
      type: parsed.data.type,
      value: parsed.data.value,
      minOrderAmount: parsed.data.minOrderAmount,
      maxDiscount: parsed.data.maxDiscount ?? null,
      perUserLimit: parsed.data.perUserLimit,
      usageLimit: parsed.data.usageLimit ?? null,
      usageCount: existing?.usageCount ?? 0,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt).getTime() : null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt).getTime() : null,
      isActive: parsed.data.isActive,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await db.ref(`coupons/${code}`).set(couponRecord);

    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save coupon" };
  }
}

export async function deleteCouponAction(
  code: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const db = getAdminDb();
    await db.ref(`coupons/${code.toUpperCase()}`).remove();

    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete coupon" };
  }
}

export async function updateInventoryStockAction(
  slug: string,
  newStock: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const db = getAdminDb();
    const stock = Math.max(0, Math.floor(newStock));

    await db.ref(`products/${slug}`).update({
      stock,
      updatedAt: Date.now(),
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    revalidatePath("/admin");
    revalidatePath(`/products/${slug}`);

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update stock" };
  }
}
