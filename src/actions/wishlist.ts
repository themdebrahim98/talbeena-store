"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/server";

export interface WishlistActionResult {
  success: boolean;
  isWishlisted?: boolean;
  items?: string[];
  error?: string;
  requiresAuth?: boolean;
}

function sanitizeKey(key: string): string {
  return key.trim().replace(/[.#$[\]/]/g, "-");
}

/**
 * Toggles a product in the authenticated user's database wishlist:
 * stored at `/wishlist/{uid}/products/{productId}: true`.
 */
export async function toggleWishlistAction(
  productId: string,
): Promise<WishlistActionResult> {
  try {
    if (!productId || typeof productId !== "string") {
      return { success: false, error: "Invalid product identifier." };
    }

    const session = await getSessionUser();
    if (!session) {
      return {
        success: false,
        error: "Please sign in to save items to your wishlist.",
        requiresAuth: true,
      };
    }

    if (!isAdminConfigured()) {
      return { success: false, error: "Database not configured." };
    }

    const db = getAdminDb();
    const safeId = sanitizeKey(productId);
    const itemRef = db.ref(`wishlist/${session.uid}/products/${safeId}`);

    const snap = await itemRef.get();
    const currentlyWishlisted = snap.exists() && snap.val() === true;

    if (currentlyWishlisted) {
      await itemRef.remove();
    } else {
      await itemRef.set(true);
    }

    // Update timestamp
    await db.ref(`wishlist/${session.uid}/updatedAt`).set(Date.now());

    try {
      revalidatePath("/account/wishlist");
    } catch {
      // Ignore static store missing in non-request test contexts
    }

    return {
      success: true,
      isWishlisted: !currentlyWishlisted,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update wishlist.";
    return { success: false, error: msg };
  }
}

/**
 * Retrieves the current authenticated user's wishlisted product IDs from RTDB.
 */
export async function getWishlistAction(): Promise<WishlistActionResult> {
  try {
    const session = await getSessionUser();
    if (!session) {
      return { success: true, items: [], requiresAuth: true };
    }

    if (!isAdminConfigured()) {
      return { success: true, items: [] };
    }

    const db = getAdminDb();
    const snap = await db.ref(`wishlist/${session.uid}/products`).get();
    const raw = snap.val() as Record<string, boolean> | null;

    if (!raw) {
      return { success: true, items: [] };
    }

    const items = Object.entries(raw)
      .filter(([, val]) => val === true)
      .map(([key]) => key);

    return { success: true, items };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load wishlist.";
    return { success: false, error: msg, items: [] };
  }
}

/**
 * Removes a specific product from the authenticated user's wishlist in RTDB.
 */
export async function removeFromWishlistAction(
  productId: string,
): Promise<WishlistActionResult> {
  try {
    const session = await getSessionUser();
    if (!session) {
      return {
        success: false,
        error: "Please sign in to update your wishlist.",
        requiresAuth: true,
      };
    }

    if (!isAdminConfigured()) {
      return { success: false, error: "Database not configured." };
    }

    const db = getAdminDb();
    const safeId = sanitizeKey(productId);
    await db.ref(`wishlist/${session.uid}/products/${safeId}`).remove();
    await db.ref(`wishlist/${session.uid}/updatedAt`).set(Date.now());

    try {
      revalidatePath("/account/wishlist");
    } catch {
      // Ignore static store missing in non-request test contexts
    }

    return { success: true, isWishlisted: false };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to remove item.";
    return { success: false, error: msg };
  }
}
