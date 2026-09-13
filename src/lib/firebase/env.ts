/**
 * True when the public Firebase client configuration is present.
 *
 * The app degrades gracefully without it (public pages render with empty
 * data, auth forms report a clear error) so a fresh clone or CI build never
 * crashes — but auth, cart persistence and checkout require real values in
 * `.env.local` (see `.env.example`).
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  );
}