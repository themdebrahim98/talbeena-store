import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/firebase/server";

/** Clear the `__session` cookie (call after Firebase client `signOut`). */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}