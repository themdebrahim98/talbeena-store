import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, beforeAll, vi } from "vitest";

beforeAll(() => {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
});

let mockSessionUser: { uid: string; email: string; isAdmin: boolean } | null = null;

vi.mock("@/lib/firebase/server", () => ({
  getSessionUser: vi.fn(async () => mockSessionUser),
}));

import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import {
  toggleWishlistAction,
  getWishlistAction,
  removeFromWishlistAction,
} from "./wishlist";

describe("Wishlist Server Actions (User-Specific Database Wishlist)", () => {
  it("rejects unauthenticated wishlist mutation with requiresAuth: true", async () => {
    mockSessionUser = null;
    const res = await toggleWishlistAction("classic-barley-talbeena");
    expect(res.success).toBe(false);
    expect(res.requiresAuth).toBe(true);
    expect(res.error).toMatch(/sign in/i);
  });

  it("validates product identifier", async () => {
    mockSessionUser = { uid: "test-user-wishlist", email: "test@talbeena.in", isAdmin: false };
    const res = await toggleWishlistAction("");
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/invalid/i);
  });

  it("saves and toggles product in user-specific RTDB node when authenticated", async () => {
    if (!isAdminConfigured()) {
      return;
    }

    const testUid = "test-user-wishlist-123";
    mockSessionUser = { uid: testUid, email: "tester@talbeena.in", isAdmin: false };
    const db = getAdminDb();
    const testSlug = "organic-saffron-talbeena";

    // Clean initial state
    await db.ref(`wishlist/${testUid}`).remove();

    // 1. Toggle ON
    const toggle1 = await toggleWishlistAction(testSlug);
    expect(toggle1.success).toBe(true);
    expect(toggle1.isWishlisted).toBe(true);

    // Verify stored in DB under user's specific path
    const dbSnap = await db.ref(`wishlist/${testUid}/products/${testSlug}`).get();
    expect(dbSnap.val()).toBe(true);

    // 2. Query wishlist
    const listRes = await getWishlistAction();
    expect(listRes.success).toBe(true);
    expect(listRes.items).toContain(testSlug);

    // 3. Toggle OFF
    const toggle2 = await toggleWishlistAction(testSlug);
    expect(toggle2.success).toBe(true);
    expect(toggle2.isWishlisted).toBe(false);

    const dbSnapAfter = await db.ref(`wishlist/${testUid}/products/${testSlug}`).get();
    expect(dbSnapAfter.exists()).toBe(false);

    // 4. Test direct remove
    await toggleWishlistAction(testSlug); // Add back
    const removeRes = await removeFromWishlistAction(testSlug);
    expect(removeRes.success).toBe(true);

    const dbSnapFinal = await db.ref(`wishlist/${testUid}/products/${testSlug}`).get();
    expect(dbSnapFinal.exists()).toBe(false);

    // Clean up
    await db.ref(`wishlist/${testUid}`).remove();
  });
});
