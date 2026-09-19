import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Droplets,
  Flame,
  Heart,
  Leaf,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Wheat,
} from "lucide-react";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/primitives/button";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { ProductCard } from "@/components/shop/product-card";
import { NewsletterSection } from "@/components/shop/newsletter-section";
import { getActiveCategories, getProducts, type CatalogProduct, type ShopCategory } from "@/queries/shop";

export const metadata: Metadata = {
  title: `${siteConfig.name} — Authentic Sunnah Superfoods & Wholesome Pantry`,
  description:
    "Stone-ground whole barley talbina, organic dry fruits, and restorative pantry staples. 100% natural, preservative-free, delivered fresh across India.",
};

// Preset category fallback visuals if image is not set on category
const CATEGORY_IMAGE_MAP: Record<string, { image: string; tag: string }> = {
  talbina: {
    image: "/images/products/talbina-classic.jpg",
    tag: "Sunnah Porridge & Blends",
  },
  "dry-fruits": {
    image: "/images/products/californian-almonds.jpg",
    tag: "Premium Raw & Roasted Nuts",
  },
  "dry-foods": {
    image: "/images/products/barley-flour.jpg",
    tag: "Stone-Ground Flours & Grains",
  },
  "healthy-foods": {
    image: "/images/products/honey-ginger-mix.jpg",
    tag: "Immunity Seeds & Infusions",
  },
  other: {
    image: "/images/products/chocolate-protein-bites.jpg",
    tag: "Artisanal Protein Snacks",
  },
};

export default async function HomePage() {
  const [categories, { products }] = await Promise.all([
    getActiveCategories(),
    getProducts({ limit: 12 }),
  ]);

  // Curate products for sections
  const bestsellers = products
    .filter((p) => p.isBestSeller || p.isFeatured)
    .slice(0, 4);
  const displayProducts = bestsellers.length >= 4 ? bestsellers : products.slice(0, 4);

  const talbinaProducts = products
    .filter((p) => p.categorySlug === "talbina")
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-16 sm:gap-24 overflow-hidden pb-12">
      <Hero />
      <TrustRibbon />
      <CategoryShowcase categories={categories} />
      <BestsellersSection products={displayProducts} />
      <HeritageStory />
      {talbinaProducts.length > 0 && <TalbinaVarietiesSection products={talbinaProducts} />}
      <PreparationRitual />
      <PurityPromise />
      <CustomerTestimonials />
      <PromoBanner />
      <NewsletterSection />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   1. HERO SECTION
   ───────────────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative pt-6 sm:pt-10 pb-8 sm:pb-16 overflow-hidden bg-radial from-primary/5 via-background to-background">
      {/* Decorative ambient background glows */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-96 w-[45rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 -z-10 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

      <Container className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left Column: Editorial Copy */}
        <div className="space-y-6 lg:col-span-7">
          {/* Social Proof Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-xs backdrop-blur-sm">
            <span className="flex items-center gap-1 text-amber-500">
              <Star className="size-3.5 fill-amber-500" />
              <span className="font-bold text-foreground">4.9</span>
            </span>
            <span className="text-primary/40">•</span>
            <span>1,200+ Morning Bowls Served</span>
            <span className="text-primary/40">•</span>
            <span className="hidden sm:inline">Authentic Sunnah Superfood</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.12]">
            Restorative nutrition for{" "}
            <span className="bg-gradient-to-r from-primary via-emerald-600 to-teal-600 bg-clip-text text-transparent">
              heart, gut &amp; mind.
            </span>
          </h1>

          {/* Body Copy */}
          <p className="max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Crafted from slow-roasted whole grain barley, raw forest honey, and sun-ripened dry fruits. Milled fresh in small batches to deliver wholesome daily vitality straight to your family’s breakfast table.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Button
              size="lg"
              className="rounded-full px-7 text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02]"
              render={<Link href="/products" />}
            >
              Shop Bestselling Blends
              <ArrowRight className="ml-2 size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-6 text-sm font-medium border-border/80 bg-card hover:bg-accent/60"
              render={<Link href="#story" />}
            >
              The Story of Talbina
            </Button>
          </div>

          {/* Reassurance Features */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-primary" />
              <span>100% Whole Grain Barley</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-primary" />
              <span>Zero Preservatives or Additives</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-primary" />
              <span>Pan-India Dispatch in 24h</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual Showcase */}
        <div className="relative mx-auto w-full max-w-lg lg:col-span-5">
          <div className="group relative aspect-square w-full overflow-hidden rounded-3xl border-2 border-primary/20 bg-card shadow-2xl transition-all duration-300">
            <Image
              src="/images/products/talbina-classic.jpg"
              alt="Steaming bowl of golden handcrafted Talbina with roasted almonds and dates"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 520px"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

            {/* Bottom Caption on Card */}
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/20 bg-background/80 p-3.5 backdrop-blur-md shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">Signature Blend</p>
                  <p className="text-sm font-semibold text-foreground">Classic Talbina Porridge</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground line-through">₹499</span>
                  <p className="text-base font-bold text-foreground">₹399</p>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Micro-Badge Top Right */}
          <div className="absolute -top-3 -right-3 hidden sm:flex items-center gap-2 rounded-2xl border border-primary/20 bg-card/90 px-3.5 py-2 text-xs font-semibold text-foreground shadow-xl backdrop-blur-md">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Leaf className="size-3.5" />
            </span>
            <span>100% Stone-Ground</span>
          </div>

          {/* Floating Micro-Badge Bottom Left */}
          <div className="absolute -bottom-4 -left-4 hidden sm:flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-card/90 px-3.5 py-2 text-xs font-semibold text-foreground shadow-xl backdrop-blur-md">
            <span className="flex size-6 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              <Sparkles className="size-3.5" />
            </span>
            <span>Sunnah Wellness Tradition</span>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. TRUST & HERITAGE RIBBON
   ───────────────────────────────────────────────────────────────────────────── */
function TrustRibbon() {
  const stats = [
    {
      icon: Wheat,
      value: "100%",
      title: "Whole Grain Barley",
      desc: "Stone-ground with husk & germ intact",
    },
    {
      icon: ShieldCheck,
      value: "0%",
      title: "No Added Sugar or Fillers",
      desc: "Natural sweetness from wild dates & honey",
    },
    {
      icon: Star,
      value: "4.9 / 5",
      title: "1,200+ Verified Reviews",
      desc: "Nourishing families across India",
    },
    {
      icon: Truck,
      value: "24–48h",
      title: "Small-Batch Fresh Roast",
      desc: "Carefully packed & rapidly shipped",
    },
  ];

  return (
    <div className="border-y border-border/70 bg-card/60 py-6 backdrop-blur-xs">
      <Container>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.title} className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <s.icon className="size-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-base sm:text-lg font-extrabold tracking-tight text-foreground">{s.value}</p>
                <p className="text-xs font-semibold text-foreground">{s.title}</p>
                <p className="text-[11px] text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. VISUAL CATEGORY SHOWCASE
   ───────────────────────────────────────────────────────────────────────────── */
function CategoryShowcase({ categories }: { categories: ShopCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <section>
      <Container className="space-y-8">
        <SectionHeading
          title="The Pantry Collection"
          subtitle="Hand-picked wholesome staples curated for daily vitality and healing"
          actions={
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              render={<Link href="/products" />}
            >
              Explore All Categories
              <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const visual = CATEGORY_IMAGE_MAP[cat.slug] || {
              image: "/images/products/talbina-classic.jpg",
              tag: "Wholesome Pantry",
            };

            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group relative flex flex-col justify-end overflow-hidden rounded-3xl border border-border/70 bg-card p-5 min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/40"
              >
                {/* Background Food Photography */}
                <Image
                  src={cat.imageUrl || visual.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Dark Gradient Overlay for Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

                {/* Content */}
                <div className="relative z-10 space-y-1.5">
                  <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase backdrop-blur-xs">
                    {visual.tag}
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight leading-snug group-hover:text-primary-foreground">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-white/70 line-clamp-1">
                    {cat.description || "Discover natural handcrafted staples"}
                  </p>
                  <div className="flex items-center gap-1 pt-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                    <span>Browse blends</span>
                    <ArrowRight className="size-3" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   4. BESTSELLERS SECTION
   ───────────────────────────────────────────────────────────────────────────── */
function BestsellersSection({ products }: { products: CatalogProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section>
      <Container className="space-y-8">
        <SectionHeading
          title="Most Cherished Bestsellers"
          subtitle="Freshly milled daily from our kitchen and loved by thousands of homes"
          actions={
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              render={<Link href="/products" />}
            >
              View Full Catalog ({products.length > 0 ? "19+" : "All"})
              <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   5. HERITAGE & SCIENCE STORY
   ───────────────────────────────────────────────────────────────────────────── */
function HeritageStory() {
  return (
    <section id="story" className="relative scroll-mt-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-6 sm:p-10 lg:p-14 shadow-xl">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute -bottom-20 -right-20 size-80 rounded-full bg-primary/10 blur-3xl" />

          <div className="grid gap-10 lg:grid-cols-12 items-center">
            {/* Left Narrative */}
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                <Heart className="size-3.5" />
                The Prophetic Heritage &amp; Modern Science
              </div>

              {/* Hadith Quote Card */}
              <div className="relative rounded-2xl border-l-4 border-primary bg-muted/40 p-5 sm:p-6 shadow-xs">
                <Quote className="size-8 text-primary/30 mb-2" />
                <p className="text-base sm:text-lg italic font-medium text-foreground leading-relaxed">
                  &ldquo;The Talbina gives rest to the heart of the patient and makes it active and relieves some of his sorrow and grief.&rdquo;
                </p>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-primary">
                  — Prophet Muhammad ﷺ · Sahih al-Bukhari 5417
                </p>
              </div>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Talbina is an ancient, restorative porridge prepared from whole-grain barley, pure milk, and wild honey. Modern clinical nutritional research validates what ancient tradition practiced: whole barley is one of the richest sources of <strong>soluble beta-glucan</strong>, providing long-lasting energy, supporting cardiovascular health, and soothing digestion.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="rounded-2xl border bg-background p-4 shadow-xs">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2.5">
                    <Droplets className="size-4" />
                  </span>
                  <h4 className="text-sm font-bold text-foreground">Soothes the Gut</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Prebiotic fibers feed beneficial microbiome and calm digestive acidity.
                  </p>
                </div>

                <div className="rounded-2xl border bg-background p-4 shadow-xs">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 mb-2.5">
                    <Flame className="size-4" />
                  </span>
                  <h4 className="text-sm font-bold text-foreground">6-Hour Vitality</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Low-glycemic complex carbohydrates prevent morning insulin spikes.
                  </p>
                </div>

                <div className="rounded-2xl border bg-background p-4 shadow-xs">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 mb-2.5">
                    <Award className="size-4" />
                  </span>
                  <h4 className="text-sm font-bold text-foreground">Mood &amp; Serotonin</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Naturally rich in tryptophan, easing anxiety and promoting calm clarity.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Visual Comparison */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border-2 border-primary/20 shadow-md">
                <Image
                  src="/images/products/talbina-nuts.jpg"
                  alt="Talbina with roasted Californian nuts and natural ingredients"
                  fill
                  sizes="(max-width: 1024px) 100vw, 400px"
                  className="object-cover"
                />
              </div>

              <div className="rounded-2xl border bg-background/95 p-5 shadow-xs space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">The Purity Guarantee</p>
                <ul className="space-y-2 text-xs text-foreground font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>Stone-ground with nutrient-dense husk &amp; germ intact</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>Slowly dry-roasted in small batches to awaken natural nuttiness</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>Zero refined sugars, zero preservatives, zero synthetic chemicals</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   6. TALBINA VARIETIES SHOWCASE
   ───────────────────────────────────────────────────────────────────────────── */
function TalbinaVarietiesSection({ products }: { products: CatalogProduct[] }) {
  return (
    <section>
      <Container className="space-y-8">
        <SectionHeading
          title="Handcrafted Talbina Flavors"
          subtitle="From our signature classic recipe to rich nut and date infusions"
          actions={
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              render={<Link href="/category/talbina" />}
            >
              See All Talbina
              <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   7. 5-MINUTE PREPARATION RITUAL
   ───────────────────────────────────────────────────────────────────────────── */
function PreparationRitual() {
  const steps = [
    {
      step: "01",
      title: "Whisk & Blend",
      time: "1 Minute",
      desc: "Add 2 heaping tablespoons of Talbina powder to 1 cup (200ml) of warm milk or water. Whisk until silky and smooth without lumps.",
    },
    {
      step: "02",
      title: "Gentle Simmer",
      time: "4 Minutes",
      desc: "Cook on low heat, stirring continuously with a wooden spoon until it gently bubbles into a rich, fragrant, creamy porridge.",
    },
    {
      step: "03",
      title: "Garnish & Savor",
      time: "Instant",
      desc: "Pour into your morning bowl. Drizzle with raw forest honey and scatter crushed roasted almonds, dates, or saffron. Enjoy hot.",
    },
  ];

  return (
    <section className="bg-muted/30 py-12 sm:py-16 border-y border-border/70">
      <Container className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            Quick &amp; Nourishing
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            The 5-Minute Morning Ritual
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            A warm, wholesome breakfast that takes less time than making toast, yet keeps you energized all morning long.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div
              key={s.step}
              className="relative rounded-3xl border bg-card p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-extrabold tracking-tight text-primary/40">{s.step}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  <Clock className="size-3" />
                  {s.time}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   8. PURITY MATRIX / CLEAN LABEL PROMISE
   ───────────────────────────────────────────────────────────────────────────── */
function PurityPromise() {
  return (
    <section>
      <Container>
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lg">
          <div className="p-6 sm:p-10 border-b bg-muted/20">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              What Sets Our Kitchen Apart
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              We never compromise on nutritional integrity. Here is how our stone-ground Talbina compares with commercial boxed breakfast cereals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-border/80">
            {/* Our Talbina */}
            <div className="p-6 sm:p-8 bg-emerald-500/5 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-foreground">Our Authentic Talbina</h3>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-foreground/90 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>100% whole grain stone-ground barley with bran and germ intact</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Infused with authentic Madinah dates and Californian nuts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Sweetened only with raw forest honey or natural dates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Zero preservatives, synthetic vitamins, or chemical anti-caking agents</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Milled and dry-roasted in small weekly batches for utmost freshness</span>
                </li>
              </ul>
            </div>

            {/* Commercial Cereals */}
            <div className="p-6 sm:p-8 bg-muted/10 space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="size-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center font-bold text-xs">✕</span>
                <h3 className="text-lg font-bold text-muted-foreground">Standard Commercial Cereals</h3>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="size-4 text-destructive shrink-0 mt-0.5 font-bold">✕</span>
                  <span>Stripped refined flour puffs lacking natural vitamins and dietary fiber</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="size-4 text-destructive shrink-0 mt-0.5 font-bold">✕</span>
                  <span>Up to 40% hidden refined white sugar, corn syrup, and maltodextrin</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="size-4 text-destructive shrink-0 mt-0.5 font-bold">✕</span>
                  <span>Synthetic spray-on vitamins and artificial flavorings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="size-4 text-destructive shrink-0 mt-0.5 font-bold">✕</span>
                  <span>Loaded with preservatives (BHT/BHA) to sit on shelves for 18+ months</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="size-4 text-destructive shrink-0 mt-0.5 font-bold">✕</span>
                  <span>Causes rapid insulin spike followed by mid-morning energy crash</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   9. VERIFIED CUSTOMER TESTIMONIALS
   ───────────────────────────────────────────────────────────────────────────── */
function CustomerTestimonials() {
  const reviews = [
    {
      name: "Dr. Zoya M.",
      location: "Bengaluru",
      rating: 5,
      product: "Talbina with Roasted Nuts",
      quote:
        "As a healthcare professional, I am very picky about breakfast. This Talbina is clean, soothing, and easily digestible. The roasted nuts are wonderfully crisp and aromatic. My morning energy has never been better!",
    },
    {
      name: "Farhan Siddiqui",
      location: "Hyderabad",
      rating: 5,
      product: "Classic Talbina + Dates",
      quote:
        "The taste took me right back to traditional preparation. You can tell immediately that this is pure stone-ground barley, not the powdered starch you get in supermarket brands. It keeps me satisfied until 2 PM with no sluggishness.",
    },
    {
      name: "Amina Khan",
      location: "Mumbai",
      rating: 5,
      product: "Talbina Mix Pack",
      quote:
        "Our entire household has replaced boxed cornflakes with Talbina porridge. Even my young children love the nutty date flavor with warm milk and honey. Delivery was prompt and packaging was completely airtight.",
    },
  ];

  return (
    <section>
      <Container className="space-y-8">
        <SectionHeading
          title="Loved by Families Across India"
          subtitle="Read genuine stories from verified buyers making Talbina their morning wellness anchor"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="flex flex-col justify-between rounded-3xl border bg-card p-6 sm:p-7 shadow-xs hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed italic">
                  &ldquo;{r.quote}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-4 border-t space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">{r.name}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    Verified Buyer
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {r.location} • Bought {r.product}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   10. PROMO / FREE SHIPPING BANNER
   ───────────────────────────────────────────────────────────────────────────── */
function PromoBanner() {
  return (
    <Container>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-emerald-800 to-teal-900 px-6 py-12 text-white shadow-2xl sm:px-12 sm:py-14">
        {/* Subtle decorative pattern background */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-100 backdrop-blur-xs">
              <Truck className="size-3.5" />
              Pan-India Complimentary Express Delivery
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-white">
              Free shipping on all orders above ₹500
            </h2>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed">
              Order your favorite Talbina blends, dry fruits, and immunity mixes today. Packed fresh in hygienic food-grade pouches and dispatched within 24 hours.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Button
              size="lg"
              className="rounded-full bg-white text-primary hover:bg-white/90 text-sm font-bold shadow-lg"
              render={<Link href="/products" />}
            >
              Claim Your Wellness Bowl
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}