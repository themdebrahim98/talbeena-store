import { getAdminOrders } from "@/queries/admin";
import { OrderManager } from "@/components/admin/order-manager";

export const metadata = {
  title: "Admin Orders",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();
  return <OrderManager initialOrders={orders} />;
}
