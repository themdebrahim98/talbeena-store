"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/primitives/alert";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import type { ActionState } from "@/actions/auth";
import type { AdminCategory } from "@/queries/admin";
import { productSchema } from "@/validations/product";

export interface ProductFormDefaults {
  name: string;
  slug: string;
  sku: string;
  categorySlug: string;
  description: string;
  ingredientsText: string;
  tagsText: string;
  price: number | "";
  compareAtPrice: number | "" | null;
  weight: number | "";
  unit: string;
  stock: number | "";
  lowStockThreshold: number | "";
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  primaryImageUrl: string | null;
}

export const EMPTY_PRODUCT: ProductFormDefaults = {
  name: "",
  slug: "",
  sku: "",
  categorySlug: "",
  description: "",
  ingredientsText: "",
  tagsText: "",
  price: "",
  compareAtPrice: "",
  weight: "",
  unit: "g",
  stock: "",
  lowStockThreshold: 10,
  isActive: true,
  isFeatured: false,
  isBestSeller: false,
  isNew: false,
  primaryImageUrl: null,
};

const UNITS = ["g", "kg", "ml", "L", "pc", "pack"];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** SKU derived from the slug when the minimal form hides the SKU field. */
function deriveSku(slug: string): string {
  const compact = slug.replace(/[^a-z0-9]/g, "").toUpperCase().slice(0, 30);
  return `TB-${compact || "ITEM"}`;
}

interface ProductFormProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  categories: AdminCategory[];
  defaults: ProductFormDefaults;
  submitLabel: string;
  pendingLabel: string;
  /** Create mode shows the slug field; edit mode keeps the slug immutable. */
  allowSlugEdit: boolean;
  /** Minimal add-form: name, category, price, stock, image, description. */
  minimal?: boolean;
}

const TEXTAREA_CLASSES =
  "min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

const SELECT_CLASSES =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring";

/**
 * Create/edit product form. All inputs are controlled (values live in React
 * state, so a validation error never wipes them) and the schema is checked in
 * the browser first — the server action only runs on valid data.
 */
export function ProductForm({
  action,
  categories,
  defaults,
  submitLabel,
  pendingLabel,
  allowSlugEdit,
  minimal = false,
}: ProductFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [clientError, setClientError] = useState<string | null>(null);

  const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  const [values, setValues] = useState({
    name: defaults.name,
    slug: defaults.slug,
    sku: defaults.sku,
    categorySlug: defaults.categorySlug,
    description: defaults.description,
    ingredientsText: defaults.ingredientsText,
    tagsText: defaults.tagsText,
    price: str(defaults.price),
    compareAtPrice: str(defaults.compareAtPrice ?? ""),
    weight: str(defaults.weight),
    unit: defaults.unit,
    stock: str(defaults.stock),
    lowStockThreshold: str(defaults.lowStockThreshold),
    isActive: defaults.isActive,
    isFeatured: defaults.isFeatured,
    isBestSeller: defaults.isBestSeller,
    isNew: defaults.isNew,
  });
  const [slugTouched, setSlugTouched] = useState(false);

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(value: string) {
    set("name", value);
    if (allowSlugEdit && !slugTouched) {
      set("slug", slugify(value));
    }
  }

  /** Validate in the browser: block the submit on bad input, keep all values. */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = new FormData(event.currentTarget);
    const parsed = productSchema.safeParse({
      name: form.get("name"),
      slug: form.get("slug"),
      sku: form.get("sku"),
      categorySlug: form.get("categorySlug"),
      description: form.get("description"),
      ingredients: form.get("ingredients") ?? "",
      tags: form.get("tags") ?? "",
      price: form.get("price"),
      compareAtPrice: form.get("compareAtPrice") ?? "",
      weight: form.get("weight"),
      unit: form.get("unit"),
      stock: form.get("stock"),
      lowStockThreshold: form.get("lowStockThreshold") ?? 0,
    });
    if (!parsed.success) {
      event.preventDefault();
      setClientError(parsed.error.issues[0]?.message ?? "Invalid input");
    } else {
      setClientError(null);
    }
  }

  const error = clientError ?? state.error;
  const effectiveSlug = allowSlugEdit ? values.slug : defaults.slug;
  const effectiveSku = minimal ? deriveSku(effectiveSlug) : values.sku;

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Slug + auto fields ride along as hidden inputs in minimal mode. */}
      {minimal && (
        <>
          <input type="hidden" name="slug" value={effectiveSlug} />
          <input type="hidden" name="sku" value={effectiveSku} />
          <input type="hidden" name="weight" value="500" />
          <input type="hidden" name="unit" value="g" />
          <input type="hidden" name="lowStockThreshold" value="10" />
          <input type="hidden" name="compareAtPrice" value="" />
          <input type="hidden" name="ingredients" value="" />
          <input type="hidden" name="tags" value="" />
          <input type="hidden" name="isActive" value="on" />
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Product name</Label>
          <Input
            id="name"
            name="name"
            value={values.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Classic Talbina"
            required
          />
        </div>

        {!minimal && (
          <div className="space-y-2">
            <Label htmlFor="slug">Slug {allowSlugEdit ? "" : "(locked)"}</Label>
            <Input
              id="slug"
              name="slug"
              value={allowSlugEdit ? values.slug : defaults.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
              readOnly={!allowSlugEdit}
              disabled={!allowSlugEdit}
              placeholder="classic-talbina"
              required={allowSlugEdit}
            />
            {allowSlugEdit && (
              <p className="text-xs text-muted-foreground">
                Used in URLs and as the database key. Cannot be changed later.
              </p>
            )}
          </div>
        )}

        {!minimal && (
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              name="sku"
              value={values.sku}
              onChange={(e) => set("sku", e.target.value)}
              placeholder="TB-TAL-001"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="categorySlug">Category</Label>
          <select
            id="categorySlug"
            name="categorySlug"
            value={values.categorySlug}
            onChange={(e) => set("categorySlug", e.target.value)}
            required
            className={SELECT_CLASSES}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
                {c.isActive ? "" : " (inactive)"}
              </option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="text-xs text-destructive">
              No categories yet — run <code>npm run seed</code> first.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price (₹)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={values.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="399"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            value={values.stock}
            onChange={(e) => set("stock", e.target.value)}
            placeholder="100"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Stone-ground barley cooked slowly…"
          required
          rows={minimal ? 3 : 4}
          className={TEXTAREA_CLASSES}
        />
      </div>

      {!minimal && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingredients (comma separated)</Label>
              <Input
                id="ingredients"
                name="ingredients"
                value={values.ingredientsText}
                onChange={(e) => set("ingredientsText", e.target.value)}
                placeholder="Barley flour, Milk, Honey"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                name="tags"
                value={values.tagsText}
                onChange={(e) => set("tagsText", e.target.value)}
                placeholder="talbina, breakfast"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="compareAtPrice">Compare-at price (₹, optional)</Label>
              <Input
                id="compareAtPrice"
                name="compareAtPrice"
                type="number"
                min="0"
                step="0.01"
                value={values.compareAtPrice}
                onChange={(e) => set("compareAtPrice", e.target.value)}
                placeholder="499"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                min="0"
                step="0.01"
                value={values.weight}
                onChange={(e) => set("weight", e.target.value)}
                placeholder="500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <select
                id="unit"
                name="unit"
                value={values.unit}
                onChange={(e) => set("unit", e.target.value)}
                required
                className={SELECT_CLASSES}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Low-stock alert at</Label>
              <Input
                id="lowStockThreshold"
                name="lowStockThreshold"
                type="number"
                min="0"
                step="1"
                value={values.lowStockThreshold}
                onChange={(e) => set("lowStockThreshold", e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <span className="text-sm leading-none font-medium">Product image</span>
        <div className="flex items-center gap-4">
          <Image
            src={defaults.primaryImageUrl ?? "/images/product-placeholder.svg"}
            alt="Product image"
            width={80}
            height={80}
            className="size-20 shrink-0 rounded-lg border object-cover"
          />
          <p className="text-xs text-muted-foreground">
            Static placeholder for now — photo uploads land later.
          </p>
        </div>
      </div>

      {!minimal && (
        <fieldset className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <legend className="sr-only">Visibility and merchandising</legend>
          {(
            [
              ["isActive", "Active (visible in store)", values.isActive],
              ["isFeatured", "Featured", values.isFeatured],
              ["isBestSeller", "Best seller", values.isBestSeller],
              ["isNew", "New arrival", values.isNew],
            ] as const
          ).map(([field, label, checked]) => (
            <label
              key={field}
              className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                name={field}
                checked={checked}
                onChange={(e) => set(field, e.target.checked)}
                className="size-4 accent-primary"
              />
              {label}
            </label>
          ))}
        </fieldset>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
