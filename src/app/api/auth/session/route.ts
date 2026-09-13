import { NextResponse } from "next/server";

import { getAdminAuth, getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/server";

/** 14 days — the maximum Firebase session-cookie lifetime. */
const SESSION_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;

/**
 * Mint the httpOnly `__session` cookie from a client Firebase ID token.
 * Called by the browser after every sign-in / registration / Google login.
 * Responds with the admin flag so callers can gate staff areas.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const idToken =
    typeof body === "object" && body !== null
      ? (body as { idToken?: unknown }).idToken
      : undefined;
  if (typeof idToken !== "string" || idToken.length === 0) {
    return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
  }

  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Firebase Admin SDK is not configured for this server. Add the " +
          "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY service-account " +
          "values from Firebase Console → Project Settings → Service accounts " +
          "to .env.local (see .env.example), then restart `npm run dev`.",
      },
      { status: 500 },
    );
  }

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });

    // Custom claims only refresh when the token refreshes, so fall back to
    // the RTDB profile role (written by `scripts/set-admin.mjs`).
    let isAdmin = decoded.admin === true;
    if (!isAdmin) {
      try {
        const snap = await getAdminDb()
          .ref(`users/${decoded.uid}/role`)
          .get();
        isAdmin = snap.val() === "admin";
      } catch {
        isAdmin = false;
      }
    }

    const res = NextResponse.json({ ok: true, isAdmin });
    res.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired credentials" },
      { status: 401 },
    );
  }
}