import { Alert, AlertDescription, AlertTitle } from "@/components/primitives/alert";
import {
  EMPTY_PRODUCT,
  ProductForm,
} from "@/components/admin/product-form";
import { createProductAction } from "@/actions/products";
import { getAllCategories } from "@/queries/admin";

export const metadata = {
  title: "Add product",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  const categories = await getAllCategories();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add product</h1>
        <p className="text-sm text-muted-foreground">
          Create a new product in the live catalog.
        </p>
      </div>

      {categories.length === 0 && (
        <Alert variant="destructive">
          <AlertTitle>No categories</AlertTitle>
          <AlertDescription>
            Add categories first with <code>npm run seed</code> (or in the
            Firebase Console), then create products.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <ProductForm
          action={createProductAction}
          categories={categories}
          defaults={EMPTY_PRODUCT}
          submitLabel="Create product"
          pendingLabel="Creating…"
          allowSlugEdit
          minimal
        />
      </div>
    </div>
  );
}
