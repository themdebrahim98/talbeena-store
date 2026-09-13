/**
 * Seed the live Firebase Realtime Database with catalog + demo coupon.
 *
 * Usage:
 *   node scripts/seed.mjs   # REQUIRES Admin creds in .env.local
 *
 * Idempotent: categories/products/coupon are keyed deterministically and
 * overwritten, so re-running is safe. Product images are only added when the
 * product has none yet.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─── Minimal .env.local loader (handles quoted values + \n escapes) ─────────
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

console.warn(
  "\nWARNING: This will modify the LIVE Firebase Realtime Database " +
    `(project: ${
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    }).\n`,
);

const { initializeApp, cert, getApps } = await import("firebase-admin/app");
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
    console.error(
      "Missing FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY in .env.local.",
    );
    process.exit(1);
  }
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

// ─── Seed data (mirrors the original catalog) ────────────────────────────────
const PLACEHOLDER = "/images/product-placeholder.svg";

const categories = [
  { slug: "talbina", name: "Talbina", description: "Traditional barley-based comfort food, gently sweetened.", sortOrder: 1 },
  { slug: "dry-fruits", name: "Dry Fruits", description: "Premium almonds, cashews, raisins, dates and more.", sortOrder: 2 },
  { slug: "dry-foods", name: "Dry Foods", description: "Shelf-stable pantry essentials: grains, flours, snacks.", sortOrder: 3 },
  { slug: "healthy-foods", name: "Healthy Foods", description: "Nutritious everyday picks for a balanced lifestyle.", sortOrder: 4 },
  { slug: "other", name: "Other", description: "Everything else we love to share.", sortOrder: 5 },
];

const products = [
  // Talbina
  { categorySlug: "talbina", name: "Classic Talbina", slug: "talbina-classic", sku: "TB-TAL-001", description: "Stone-ground barley cooked slowly into a luscious, gently sweet porridge. The traditional post-illness comfort food, naturally rich in beta-glucan.", ingredients: ["Barley flour", "Milk", "Honey"], tags: ["talbina", "breakfast", "comfort-food"], price: 399, compareAtPrice: 499, weight: 500, unit: "g", stock: 120, lowStockThreshold: 10, isFeatured: true, isBestSeller: true, isNew: false },
  { categorySlug: "talbina", name: "Talbina with Nuts", slug: "talbina-with-nuts", sku: "TB-TAL-002", description: "Our classic talbina folded with roasted almonds, walnuts and pistachios for extra crunch and healthy fats.", ingredients: ["Barley flour", "Milk", "Honey", "Almonds", "Walnuts", "Pistachios"], tags: ["talbina", "with-nuts", "premium"], price: 549, compareAtPrice: 649, weight: 500, unit: "g", stock: 80, lowStockThreshold: 10, isFeatured: true, isBestSeller: true, isNew: true },
  { categorySlug: "talbina", name: "Talbina with Dates", slug: "talbina-with-dates", sku: "TB-TAL-003", description: "Mellow dates bring natural caramel sweetness to our stone-ground barley base. No added sugar.", ingredients: ["Barley flour", "Milk", "Dates"], tags: ["talbina", "dates", "no-added-sugar"], price: 469, compareAtPrice: 549, weight: 500, unit: "g", stock: 95, lowStockThreshold: 10, isFeatured: false, isBestSeller: false, isNew: false },
  { categorySlug: "talbina", name: "Talbina Mix Pack", slug: "talbina-mix-pack", sku: "TB-TAL-004", description: "A sampler of classic, nut and date talbina — the perfect way to explore the range.", ingredients: ["Barley flour", "Milk", "Honey", "Dates", "Almonds"], tags: ["talbina", "gift", "mix-pack"], price: 1299, compareAtPrice: 1599, weight: 1500, unit: "g", stock: 40, lowStockThreshold: 5, isFeatured: false, isBestSeller: false, isNew: true },
  // Dry fruits
  { categorySlug: "dry-fruits", name: "Premium Californian Almonds", slug: "premium-californian-almonds", sku: "TB-DRF-001", description: "Plump, crunchy almonds with a clean buttery finish. Unsalted and unroasted.", ingredients: ["Almonds"], tags: ["almonds", "dry-fruits", "unsalted"], price: 349, compareAtPrice: 429, weight: 500, unit: "g", stock: 200, lowStockThreshold: 15, isFeatured: true, isBestSeller: true, isNew: false },
  { categorySlug: "dry-fruits", name: "Roasted Kaju (Cashews)", slug: "roasted-kaju-cashews", sku: "TB-DRF-002", description: "Mildly roasted whole cashews with a light salt dusting — a family favourite.", ingredients: ["Cashews", "Salt"], tags: ["cashews", "kaju", "roasted"], price: 449, compareAtPrice: 549, weight: 400, unit: "g", stock: 150, lowStockThreshold: 15, isFeatured: true, isBestSeller: false, isNew: false },
  { categorySlug: "dry-fruits", name: "Tunisian Dates (Deglet Noor)", slug: "tunisian-dates", sku: "TB-DRF-003", description: "Soft, honey-sweet semi-dry dates. Great as a snack or for baking.", ingredients: ["Dates"], tags: ["dates", "tunisian"], price: 299, compareAtPrice: 359, weight: 500, unit: "g", stock: 180, lowStockThreshold: 15, isFeatured: false, isBestSeller: false, isNew: false },
  { categorySlug: "dry-fruits", name: "Munakka (Dried Grapes)", slug: "munakka-dried-grapes", sku: "TB-DRF-004", description: "Naturally sun-dried matured grapes, deeply sweet with soft chewy flesh.", ingredients: ["Dried grapes"], tags: ["munakka", "raisins", "dry-fruits"], price: 379, compareAtPrice: 449, weight: 400, unit: "g", stock: 110, lowStockThreshold: 10, isFeatured: false, isBestSeller: false, isNew: true },
  // Dry foods
  { categorySlug: "dry-foods", name: "Stone-Ground Barley Flour", slug: "stone-ground-barley-flour", sku: "TB-DDF-001", description: "Fine stone-ground barley powder — the authentic base for homemade talbina.", ingredients: ["Barley"], tags: ["barley", "flour", "talbina-base"], price: 249, compareAtPrice: 299, weight: 1000, unit: "g", stock: 160, lowStockThreshold: 20, isFeatured: false, isBestSeller: true, isNew: false },
  { categorySlug: "dry-foods", name: "Multi-Millet Flour", slug: "multi-millet-flour", sku: "TB-DDF-002", description: "A balanced blend of jowar, ragi and bajra flours for soft rotis and warm porridge.", ingredients: ["Jowar", "Ragi", "Bajra"], tags: ["millet", "flour", "gluten-free"], price: 179, compareAtPrice: 219, weight: 1000, unit: "g", stock: 140, lowStockThreshold: 20, isFeatured: false, isBestSeller: false, isNew: true },
  { categorySlug: "dry-foods", name: "Organic Oats (Rolled)", slug: "organic-rolled-oats", sku: "TB-DDF-003", description: "Whole-grain rolled oats, creamy in minutes. Single estate, no additives.", ingredients: ["Rolled oats"], tags: ["oats", "breakfast", "organic"], price: 199, compareAtPrice: 249, weight: 1000, unit: "g", stock: 170, lowStockThreshold: 20, isFeatured: true, isBestSeller: false, isNew: false },
  { categorySlug: "dry-foods", name: "Roasted Chana (Gram)", slug: "roasted-chana-gram", sku: "TB-DDF-004", description: "Crisp roasted Bengal gram, lightly spiced. A protein-rich desi snack.", ingredients: ["Bengal gram", "Chilli", "Salt"], tags: ["chana", "snack", "high-protein"], price: 129, compareAtPrice: 159, weight: 500, unit: "g", stock: 220, lowStockThreshold: 20, isFeatured: false, isBestSeller: true, isNew: false },
  // Healthy foods
  { categorySlug: "healthy-foods", name: "Honey-Ginger Immunity Mix", slug: "honey-ginger-immunity-mix", sku: "TB-HLF-001", description: "Warm ginger and raw honey over crunchy seeds — a delicious daily health boost.", ingredients: ["Raw honey", "Ginger", "Sunflower seeds", "Roasted gram"], tags: ["immunity", "honey", "ginger"], price: 329, compareAtPrice: 399, weight: 400, unit: "g", stock: 90, lowStockThreshold: 10, isFeatured: true, isBestSeller: false, isNew: true },
  { categorySlug: "healthy-foods", name: "Flaxseed Power Mix", slug: "flaxseed-power-mix", sku: "TB-HLF-002", description: "Ground flaxseed with chia and pumpkin seeds for delicate omega-3 and fibre.", ingredients: ["Flaxseed", "Chia", "Pumpkin seeds"], tags: ["flaxseed", "chia", "omega-3"], price: 279, compareAtPrice: 339, weight: 400, unit: "g", stock: 75, lowStockThreshold: 10, isFeatured: false, isBestSeller: false, isNew: false },
  { categorySlug: "healthy-foods", name: "Chocolate Protein Bites", slug: "chocolate-protein-bites", sku: "TB-HLF-003", description: "Soft cocoa and date bites with roasted peanuts — 8g protein per serving.", ingredients: ["Dates", "Cocoa", "Peanuts", "Oats"], tags: ["protein", "snack", "no-added-sugar"], price: 349, compareAtPrice: 419, weight: 400, unit: "g", stock: 85, lowStockThreshold: 10, isFeatured: true, isBestSeller: true, isNew: true },
  { categorySlug: "healthy-foods", name: "Digestive Seed Mix", slug: "digestive-seed-mix", sku: "TB-HLF-004", description: "Fennel, psyllium and sesame in a ready sprinkle for smooth digestion.", ingredients: ["Fennel", "Psyllium", "Sesame"], tags: ["digestive", "seeds", "fennel"], price: 239, compareAtPrice: 289, weight: 350, unit: "g", stock: 60, lowStockThreshold: 10, isFeatured: false, isBestSeller: false, isNew: false },
];

const toIndexed = (arr) => Object.fromEntries(arr.map((v, i) => [String(i), v]));

// ─── Seed ────────────────────────────────────────────────────────────────────
const now = Date.now();

console.log(`Seeding LIVE database (project: ${projectId})…`);

// Categories (keyed by slug)
const catBySlug = {};
for (const c of categories) {
  catBySlug[c.slug] = c.slug;
  await db.ref(`categories/${c.slug}`).set({
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: null,
    parentId: null,
    sortOrder: c.sortOrder,
    isActive: true,
  });
}
console.log(`  categories: ${categories.length}`);

// Products (keyed by slug) + primary placeholder image + index nodes
const updates = {};
let featured = 0, best = 0, fresh = 0;
for (const p of products) {
  const cat = categories.find((c) => c.slug === p.categorySlug);
  updates[`products/${p.slug}`] = {
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    categoryId: p.categorySlug,
    categorySlug: p.categorySlug,
    categoryName: cat.name,
    description: p.description,
    ingredients: toIndexed(p.ingredients),
    tags: toIndexed(p.tags),
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    weight: p.weight,
    unit: p.unit,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    isActive: true,
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    isNew: p.isNew,
    primaryImageUrl: PLACEHOLDER,
    createdAt: now,
    updatedAt: now,
  };
  updates[`productIndex/byCategory/${p.categorySlug}/${p.slug}`] = true;
  if (p.isFeatured) { updates[`productIndex/byFeatured/${p.slug}`] = true; featured++; }
  if (p.isBestSeller) { updates[`productIndex/byBestSeller/${p.slug}`] = true; best++; }
  if (p.isNew) { updates[`productIndex/byNew/${p.slug}`] = true; fresh++; }

  // Primary placeholder image (only if the product has no images yet)
  const existing = await db.ref("productImages").orderByChild("productId").equalTo(p.slug).get();
  if (!existing.exists()) {
    const imgRef = db.ref("productImages").push();
    updates[`productImages/${imgRef.key}`] = {
      productId: p.slug,
      url: PLACEHOLDER,
      alt: p.name,
      sortOrder: 1,
      isPrimary: true,
    };
  }
}
await db.ref().update(updates);
console.log(`  products: ${products.length} (featured: ${featured}, best: ${best}, new: ${fresh})`);

// Demo coupon
await db.ref("coupons/WELCOME10").set({
  id: "WELCOME10",
  code: "WELCOME10",
  type: "percentage",
  value: 10,
  minOrderAmount: 399,
  maxDiscount: 100,
  perUserLimit: 1,
  usageLimit: 1000,
  usageCount: 0,
  startsAt: now - 24 * 60 * 60 * 1000,
  expiresAt: now + 90 * 24 * 60 * 60 * 1000,
  isActive: true,
  createdAt: now,
  updatedAt: now,
});
console.log("  coupons: WELCOME10");

console.log("Done. Next: create your admin user in the app, then run:");
console.log("  node scripts/set-admin.mjs you@example.com");
process.exit(0);
