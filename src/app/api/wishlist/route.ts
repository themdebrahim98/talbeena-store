import { NextResponse } from "next/server";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/server";
import { toggleWishlistAction } from "@/actions/wishlist";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({
        isAuthenticated: false,
        items: [],
      });
    }

    if (!isAdminConfigured()) {
      return NextResponse.json({
        isAuthenticated: true,
        items: [],
      });
    }

    const db = getAdminDb();
    const snap = await db.ref(`wishlist/${session.uid}/products`).get();
    const raw = snap.val() as Record<string, boolean> | null;

    const items = raw
      ? Object.entries(raw)
          .filter(([, val]) => val === true)
          .map(([key]) => key)
      : [];

    return NextResponse.json({
      isAuthenticated: true,
      items,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg, items: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { productId?: string };
    if (!body.productId || typeof body.productId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid productId" },
        { status: 400 },
      );
    }

    const result = await toggleWishlistAction(body.productId);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, requiresAuth: result.requiresAuth },
        { status: result.requiresAuth ? 401 : 400 },
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
