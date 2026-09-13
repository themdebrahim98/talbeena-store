import type { Metadata } from "next";
import { getShopUser, getUserAddresses } from "@/queries/shop";
import { AddressManager } from "@/components/shop/account/address-manager";

export const metadata: Metadata = {
  title: "Delivery Addresses",
  robots: { index: false, follow: true },
};

export default async function AccountAddressesPage() {
  const user = await getShopUser();
  const addresses = user ? await getUserAddresses(user.id) : [];

  return <AddressManager initialAddresses={addresses} />;
}