import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { getShopUser, getUserAddresses, getProducts } from "@/queries/shop";

export const metadata: Metadata = {
  title: "Secure Checkout",
  description: "Complete your order with flexible delivery and secure payments.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ coupon?: string }>;
}) {
  const params = await searchParams;
  const user = await getShopUser();
  const [savedAddresses, { products }] = await Promise.all([
    user ? getUserAddresses(user.id) : Promise.resolve([]),
    getProducts({ limit: 100 }),
  ]);

  return (
    <div className="py-10">
      <Container className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Checkout
          </h1>
          <p className="text-sm text-muted-foreground">
            Provide your delivery details and choose your preferred payment method.
          </p>
        </div>

        <CheckoutForm
          user={user}
          savedAddresses={savedAddresses}
          products={products}
          initialCoupon={params.coupon}
        />
      </Container>
    </div>
  );
}
