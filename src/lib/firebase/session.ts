/**
 * Browser-side session helpers. After any Firebase Auth mutation the client
 * exchanges its ID token for an httpOnly `__session` cookie (minted by
 * `/api/auth/session`) so Server Components, actions and guards see the user.
 */

export interface EstablishedSession {
  isAdmin: boolean;
}

/** Mint (or refresh) the server session cookie from a Firebase ID token. */
export async function establishSession(
  idToken: string,
): Promise<EstablishedSession> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    throw new Error("Could not create a server session. Try again.");
  }
  const data = (await res.json()) as { isAdmin?: boolean };
  return { isAdmin: data.isAdmin === true };
}

/** Clear the server session cookie (call after Firebase `signOut`). */
export async function clearSession(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}