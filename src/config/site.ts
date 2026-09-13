export const siteConfig = {
  name: "Talbeena",
  nameAr: "طليبينة",
  tagline: "Wholesome foods, crafted for everyday health",
  description:
    "Talbeena delivers premium talbina, dry fruits, dry foods and healthy packaged foods to your doorstep.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contact: {
    email: "hello@talbeena.com",
    phone: "+91 98765 43210",
    address: "Mumbai, Maharashtra, India",
  },
  socials: {
    instagram: "#",
    whatsapp: "#",
  },
  paths: {
    products: "/products",
    cart: "/cart",
    checkout: "/checkout",
    account: "/account",
    wishlist: "/account/wishlist",
  },
} as const;

export type SiteConfig = typeof siteConfig;