/**
 * Sync real product images to the live Firebase Realtime Database
 * without modifying orders, users, or other data.
 *
 * Usage:
 *   node scripts/sync-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split("\n");
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
loadEnvFile(path.join(ROOT, ".env.local"));

const { initializeApp, cert, getApps } = await import("firebase-admin/app");
const { getDatabase } = await import("firebase-admin/database");

const projectId =
  process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const databaseURL =
  process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase Admin credentials in .env.local");
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    ...(databaseURL ? { databaseURL } : {}),
  });
}

const db = getDatabase();

const PRODUCT_IMAGE_MAP = {
  "talbina-classic": "/images/products/talbina-classic.jpg",
  "talbina-with-nuts": "/images/products/talbina-nuts.jpg",
  "talbina-with-dates": "/images/products/talbina-dates.jpg",
  "talbina-mix-pack": "/images/products/talbina-classic.jpg",
  "premium-californian-almonds": "/images/products/californian-almonds.jpg",
  "roasted-kaju-cashews": "/images/products/roasted-cashews.jpg",
  "tunisian-dates": "/images/products/tunisian-dates.jpg",
  "munakka-dried-grapes": "/images/products/tunisian-dates.jpg",
  "stone-ground-barley-flour": "/images/products/barley-flour.jpg",
  "multi-millet-flour": "/images/products/barley-flour.jpg",
  "organic-rolled-oats": "/images/products/organic-oats.jpg",
  "roasted-chana-gram": "/images/products/roasted-cashews.jpg",
  "honey-ginger-immunity-mix": "/images/products/honey-ginger-mix.jpg",
  "flaxseed-power-mix": "/images/products/organic-oats.jpg",
  "chocolate-protein-bites": "/images/products/chocolate-protein-bites.jpg",
  "digestive-seed-mix": "/images/products/honey-ginger-mix.jpg",
};

console.log("Updating live products with real images...");
const snap = await db.ref("products").get();
const products = snap.val() || {};

const updates = {};
let count = 0;

for (const [slug, p] of Object.entries(products)) {
  const realImage = PRODUCT_IMAGE_MAP[slug] || "/images/products/talbina-classic.jpg";
  updates[`products/${slug}/primaryImageUrl`] = realImage;
  count++;
}

if (count > 0) {
  await db.ref().update(updates);
  console.log(`Successfully synced real images to ${count} products in Firebase!`);
} else {
  console.log("No products found to update.");
}

process.exit(0);
