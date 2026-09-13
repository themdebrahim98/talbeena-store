import { getAdminCoupons } from "@/queries/admin";
import { CouponManager } from "@/components/admin/coupon-manager";

export const metadata = {
  title: "Coupons",
  robots: { index: false, follow: false },
};

export default async function AdminCouponsPage() {
  const coupons = await getAdminCoupons();
  return <CouponManager initialCoupons={coupons} />;
}
