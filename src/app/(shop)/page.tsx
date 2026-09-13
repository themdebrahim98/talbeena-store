import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Banknote,
  Clock,
  Leaf,
  Sprout,
  Truck,
  Wheat,
} from "lucide-react";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/primitives/button";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeading } from "@/components/shared/section-heading";
import { NewsletterSection } from "@/components/shop/newsletter-section";

import { getActiveCategories } from "@/queries/shop";

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
};

export default async function HomePage() {
  const categories = await getActiveCategories();

  return (
    <>
      <Hero />
      <TrustStrip />

      <Container className="py-16">
        <SectionHeading
          title="Shop by category"
          subtitle="Curated wholesome staples for every pantry"
        />
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center transition-shadow hover:shadow-md"
              >
                <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Wheat className="size-6" />
                </span>
                <span className="text-sm font-medium">{category.name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Categories are on the way"
            description="Once the store is seeded you will see your product categories here."
            actionHref="/products"
          />
        )}
      </Container>

      <PromoBanner />

      <Container className="py-16">
        <WhyChooseUs />
      </Container>

      <NewsletterSection />
    </>
  );
}

function Hero() {
  return (
    <section className="border-b bg-gradient-to-b from-primary/10 via-background to-background">
      <Container className="grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Leaf className="size-3.5" />
            100% natural & hand-crafted
          </span>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Wholesome talbina &amp; dry foods,
            <span className="text-primary"> delivered fresh.</span>
          </h1>
          <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
            Premium talbina, dry fruits and healthy pantry staples — sourced
            carefully, packed hygienically and shipped straight from our kitchen
            to your home.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" render={<Link href="/products" />}>
              Shop now
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/category/talbina" />}>
              Explore talbina
            </Button>
          </div>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl border bg-accent/40">
          <Image
            src="/images/hero-talbina.svg"
            alt="A bowl of golden talbina with dried fruits and nuts"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 500px"
            className="object-cover"
          />
        </div>
      </Container>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: Truck, title: "Fast delivery", sub: "Ships within 24–48 hrs" },
    { icon: Leaf, title: "100% natural", sub: "No preservatives" },
    { icon: Banknote, title: "COD available", sub: "Pay on delivery" },
    { icon: BadgeCheck, title: "Premium quality", sub: "Hand-picked staples" },
  ];

  return (
    <div className="border-b bg-card">
      <Container className="grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <item.icon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </div>
          </div>
        ))}
      </Container>
    </div>
  );
}

function PromoBanner() {
  return (
    <Container>
      <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-10">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary-foreground/80">
              <Clock className="size-4" /> Limited time offer
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Free shipping on orders above ₹500
            </h2>
            <p className="text-sm text-primary-foreground/80">
              Flat ₹49 shipping on smaller orders. Across India.
            </p>
          </div>
          <Button
            size="lg"
            variant="secondary"
            className="shrink-0"
            render={<Link href="/products" />}
          >
            Start shopping
          </Button>
        </div>
      </div>
    </Container>
  );
}

function WhyChooseUs() {
  const items = [
    {
      icon: Sprout,
      title: "Sourced with care",
      body: "Ingredients are selected from trusted growers and suppliers who share our quality standards.",
    },
    {
      icon: Clock,
      title: "Prepared fresh",
      body: "Small-batch preparation keeps every pack flavourful, hygienic and full of natural goodness.",
    },
    {
      icon: Truck,
      title: "Pan-India delivery",
      body: "Careful packaging and reliable shipping so your order arrives fresh across India.",
    },
    {
      icon: Banknote,
      title: "Easy payments",
      body: "Pay online securely or choose Cash on Delivery at checkout. Your money is always safe.",
    },
  ];

  return (
    <div>
      <SectionHeading
        title="Why choose Talbeena"
        subtitle="The little things we do differently"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <item.icon className="size-5" />
            </span>
            <h3 className="mt-4 font-semibold">{item.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}