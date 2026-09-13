import { getAllCategories } from "@/queries/admin";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata = {
  title: "Categories",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories();
  return <CategoryManager initialCategories={categories} />;
}
