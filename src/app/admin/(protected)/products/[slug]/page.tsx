import { notFound } from "next/navigation";

import {
  ProductForm,
  type ProductFormDefaults,
} from "@/components/admin/product-form";
import { updateProductAction } from "@/actions/products";
import { getAdminProduct, getAllCategories } from "@/queries/admin";

export const metadata = {
  title: "Edit product",
  robots: { index: false, follow: false },
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [detail, categories] = await Promise.all([
    getAdminProduct(slug),
    getAllCategories(),
  ]);

  if (!detail) notFound();

  const { product } = detail;
  const defaults: ProductFormDefaults = {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    categorySlug: product.categorySlug,
    description: product.description,
    ingredientsText: detail.ingredientsText,
    tagsText: detail.tagsText,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? "",
    weight: product.weight,
    unit: product.unit,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    isBestSeller: product.isBestSeller,
    isNew: product.isNew,
    primaryImageUrl: product.primaryImageUrl ?? null,
  };

  const boundUpdate = updateProductAction.bind(null, slug);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit product</h1>
        <p className="text-sm text-muted-foreground">
          {product.name} <span className="text-muted-foreground/70">· /{product.slug}</span>
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <ProductForm
          action={boundUpdate}
          categories={categories}
          defaults={defaults}
          submitLabel="Save changes"
          pendingLabel="Saving…"
          allowSlugEdit={false}
        />
      </div>
    </div>
  );
}
