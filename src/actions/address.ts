"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/server";
import { addressSchema, type AddressInput } from "@/validations/address";
import type { Address } from "@/types/firebase";

export async function saveAddressAction(
  data: AddressInput,
  addressId?: string,
): Promise<{ success: boolean; error?: string; addressId?: string }> {
  try {
    const session = await getSessionUser();
    if (!session) {
      return { success: false, error: "You must be signed in to save an address." };
    }

    const parsed = addressSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid address data",
      };
    }

    const db = getAdminDb();
    const uid = session.uid;
    const now = Date.now();

    const targetId = addressId || db.ref(`addresses/${uid}`).push().key!;

    if (parsed.data.isDefault) {
      // Unset previous defaults
      const existingSnap = await db.ref(`addresses/${uid}`).get();
      const existing = (existingSnap.val() ?? {}) as Record<string, Address>;
      const updates: Record<string, unknown> = {};
      for (const [id, addr] of Object.entries(existing)) {
        if (id !== targetId && addr.isDefault) {
          updates[`addresses/${uid}/${id}/isDefault`] = false;
        }
      }
      if (Object.keys(updates).length > 0) {
        await db.ref().update(updates);
      }
    }

    const addressRecord: Address = {
      name: parsed.data.name,
      phone: parsed.data.phone,
      line1: parsed.data.line1,
      line2: parsed.data.line2 ?? null,
      city: parsed.data.city,
      state: parsed.data.state,
      pincode: parsed.data.pincode,
      country: parsed.data.country || "India",
      isDefault: parsed.data.isDefault,
      createdAt: now,
    };

    await db.ref(`addresses/${uid}/${targetId}`).set(addressRecord);

    revalidatePath("/account/addresses");
    revalidatePath("/checkout");

    return { success: true, addressId: targetId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save address";
    return { success: false, error: msg };
  }
}

export async function deleteAddressAction(
  addressId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSessionUser();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const db = getAdminDb();
    await db.ref(`addresses/${session.uid}/${addressId}`).remove();

    revalidatePath("/account/addresses");
    revalidatePath("/checkout");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete address";
    return { success: false, error: msg };
  }
}

export async function setDefaultAddressAction(
  addressId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSessionUser();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const db = getAdminDb();
    const snap = await db.ref(`addresses/${session.uid}`).get();
    const existing = (snap.val() ?? {}) as Record<string, Address>;

    const updates: Record<string, unknown> = {};
    for (const id of Object.keys(existing)) {
      updates[`addresses/${session.uid}/${id}/isDefault`] = id === addressId;
    }

    await db.ref().update(updates);

    revalidatePath("/account/addresses");
    revalidatePath("/checkout");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to set default address";
    return { success: false, error: msg };
  }
}
