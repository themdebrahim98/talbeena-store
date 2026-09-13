import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getShopUser, getUserWishlist } from "@/queries/shop";
import { WishlistView } from "@/components/shop/account/wishlist-view";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: true },
};

export default async function AccountWishlistPage() {
  const user = await getShopUser();
  if (!user) {
    redirect("/login");
  }

  const products = await getUserWishlist(user.id);

  return <WishlistView initialProducts={products} />;
}