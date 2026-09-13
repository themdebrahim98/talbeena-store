import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug must be at least 2 characters")
  .max(80, "Slug must be at most 80 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug may only contain lowercase letters, numbers and hyphens",
  );

const rupee = (label: string) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .finite(`${label} must be a number`)
    .min(0, `${label} cannot be negative`)
    .max(10_000_000, `${label} is too large`);

const wholeUnits = (label: string) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(0, `${label} cannot be negative`)
    .max(1_000_000, `${label} is too large`);

/** Shared product fields (create + edit). Image file + flags parsed separately. */
export const productSchema = z.object({
  name: z.string().trim().min(2, "Enter a product name").max(120),
  slug: slugSchema,
  sku: z
    .string()
    .trim()
    .min(2, "Enter an SKU")
    .max(40, "SKU must be at most 40 characters")
    .regex(/^[A-Za-z0-9-_]+$/, "SKU may only contain letters, numbers, - and _"),
  categorySlug: z.string().trim().min(1, "Choose a category"),
  description: z.string().trim().min(10, "Describe the product (min 10 characters)").max(4000),
  ingredients: z.string().trim().max(2000).default(""),
  tags: z.string().trim().max(1000).default(""),
  price: rupee("Price"),
  compareAtPrice: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.union([
      z.null(),
      z.coerce
        .number({ error: "Compare-at price must be a number" })
        .finite("Compare-at price must be a number")
        .min(0, "Compare-at price cannot be negative")
        .max(10_000_000, "Compare-at price is too large"),
    ]),
  ),
  weight: z.coerce
    .number({ error: "Weight must be a number" })
    .finite("Weight must be a number")
    .positive("Weight must be positive")
    .max(100_000, "Weight is too large"),
  unit: z.enum(["g", "kg", "ml", "L", "pc", "pack"], {
    error: "Choose a unit",
  }),
  stock: wholeUnits("Stock"),
  lowStockThreshold: wholeUnits("Low-stock threshold"),
});

export type ProductInput = z.infer<typeof productSchema>;
