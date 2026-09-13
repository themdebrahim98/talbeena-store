import { notFound } from "next/navigation";
import { getAdminOrderDetail } from "@/queries/admin";
import { OrderDetailView } from "@/components/admin/order-detail-view";

export const metadata = {
  title: "Order Details",
  robots: { index: false, follow: false },
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderData = await getAdminOrderDetail(id);

  if (!orderData) {
    notFound();
  }

  return <OrderDetailView orderData={orderData} />;
}
