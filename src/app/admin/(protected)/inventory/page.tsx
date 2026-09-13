import { getAdminProducts } from "@/queries/admin";
import { InventoryTable } from "@/components/admin/inventory-table";

export const metadata = {
  title: "Inventory",
  robots: { index: false, follow: false },
};

export default async function AdminInventoryPage() {
  const products = await getAdminProducts();
  return <InventoryTable initialProducts={products} />;
}
