import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { CartView } from "@/components/shop/cart-view";
import { getProducts } from "@/queries/shop";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review your selected healthy items and proceed to secure checkout.",
};

export default async function CartPage() {
  const { products } = await getProducts({ limit: 100 });

  return (
    <div className="py-10">
      <Container className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Shopping Cart
          </h1>
          <p className="text-sm text-muted-foreground">
            Review your wholesome goods before heading to checkout.
          </p>
        </div>

        <CartView products={products} />
      </Container>
    </div>
  );
}
