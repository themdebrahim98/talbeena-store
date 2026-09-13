/**
 * Grant admin access to a user (custom claim + RTDB profile role).
 *
 * Usage:
 *   node scripts/set-admin.mjs you@example.com
 *   node scripts/set-admin.mjs you@example.com --revoke  # remove admin
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const revoke = process.argv.includes("--revoke");
const email = process.argv.find((a) => !a.startsWith("--") && !a.endsWith(".mjs"));

if (!email || !email.includes("@")) {
  console.error("Usage: node scripts/set-admin.mjs you@example.com [--revoke]");
  process.exit(1);
}

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
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
loadEnvFile(path.join(ROOT, ".env.local"));

const { initializeApp, cert, getApps } = await import("firebase-admin/app");
const { getAuth } = await import("firebase-admin/auth");
const { getDatabase } = await import("firebase-admin/database");

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error("Missing Firebase project id (.env.local / .env.example).");
  process.exit(1);
}

const databaseURL =
  process.env.FIREBASE_DATABASE_URL ||
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

if (getApps().length === 0) {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    console.error("Missing FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY in .env.local.");
    process.exit(1);
  }
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    ...(databaseURL ? { databaseURL } : {}),
  });
}

const auth = getAuth();
const db = getDatabase();

const user = await auth.getUserByEmail(email).catch(() => null);
if (!user) {
  console.error(`No Firebase Auth user found for ${email}. Register in the app first.`);
  process.exit(1);
}

if (revoke) {
  await auth.setCustomUserClaims(user.uid, { admin: false });
  await db.ref(`users/${user.uid}/role`).set("customer");
  console.log(`Revoked admin from ${email} (${user.uid}).`);
} else {
  await auth.setCustomUserClaims(user.uid, { admin: true });
  const snap = await db.ref(`users/${user.uid}`).get();
  const existing = snap.val() ?? {};
  await db.ref(`users/${user.uid}`).update({
    ...existing,
    role: "admin",
    fullName: existing.fullName ?? user.displayName ?? email.split("@")[0],
    isActive: true,
    updatedAt: Date.now(),
    createdAt: existing.createdAt ?? Date.now(),
  });
  console.log(`Granted admin to ${email} (${user.uid}). Sign out + back in to refresh claims.`);
}
process.exit(0);