import { getAdminOrders } from "@/queries/admin";
import { OrderManager } from "@/components/admin/order-manager";

export const metadata = {
  title: "Admin Orders",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const orders = await getAdminOrders();
  return (
    <OrderManager
      initialOrders={orders}
      defaultFilter={params?.status ? params.status.toUpperCase() : "ALL"}
    />
  );
}
