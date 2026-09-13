"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/server";
import type { UserProfile } from "@/types/firebase";

import {
  profileSchema,
  resetPasswordSchema,
} from "@/validations/auth";

export interface ActionState {
  error?: string;
  message?: string;
}

// ─── Ensure profile (called after sign-in / registration / Google login) ────
export async function ensureUserProfile(input: {
  fullName: string;
  phone?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "You must be signed in." };

  try {
    const db = getAdminDb();
    const ref = db.ref(`users/${session.uid}`);
    const snap = await ref.get();

    if (!snap.exists()) {
      const now = Date.now();
      const profile: UserProfile = {
        fullName: input.fullName,
        phone: input.phone ?? null,
        role: "customer",
        isActive: true,
        avatarUrl: null,
        createdAt: now,
        updatedAt: now,
      };
      await ref.set(profile);
    }

    try {
      await getAdminAuth().updateUser(session.uid, {
        displayName: input.fullName,
      });
    } catch {
      // Display-name sync is best-effort; the RTDB profile is the source of truth.
    }

    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not set up your profile." };
  }
}

// ─── Change password (signed-in settings page, via Admin SDK) ───────────────
export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await getSessionUser();
  if (!session) return { error: "You must be signed in." };

  try {
    await getAdminAuth().updateUser(session.uid, {
      password: parsed.data.password,
    });
  } catch {
    return { error: "Could not update your password. Try again." };
  }

  revalidatePath("/account", "layout");
  redirect("/account");
}

// ─── Update profile ──────────────────────────────────────────────────────────
export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await getSessionUser();
  if (!session) return { error: "You must be signed in." };

  try {
    const db = getAdminDb();
    const ref = db.ref(`users/${session.uid}`);
    const snap = await ref.get();
    const existing = (snap.val() as UserProfile | null) ?? null;

    const profile: UserProfile = {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone ?? null,
      role: existing?.role ?? "customer",
      isActive: existing?.isActive ?? true,
      avatarUrl: existing?.avatarUrl ?? null,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    await ref.set(profile);

    try {
      await getAdminAuth().updateUser(session.uid, {
        displayName: parsed.data.fullName,
      });
    } catch {
      // Best-effort only.
    }
  } catch {
    return { error: "Could not update your profile." };
  }

  revalidatePath("/account", "layout");
  return { message: "Profile updated." };
}