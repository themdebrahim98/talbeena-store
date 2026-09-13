import { cookies } from "next/headers";

import { getAdminAuth } from "@/lib/firebase/admin";

/** Name of the httpOnly session cookie minted by `/api/auth/session`. */
export const SESSION_COOKIE_NAME = "__session";

export interface SessionUser {
  uid: string;
  email: string;
  /** True when the `admin` custom claim is set on the Firebase Auth user. */
  isAdmin: boolean;
}

/**
 * Read + verify the Firebase session cookie (server only). Returns `null`
 * when anonymous, expired, revoked or misconfigured — callers treat that as
 * "signed out" so public pages never crash.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = await getAdminAuth().verifySessionCookie(token, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      isAdmin: decoded.admin === true,
    };
  } catch {
    return null;
  }
}