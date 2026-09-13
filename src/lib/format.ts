import { businessConfig } from "@/config/business";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Format an amount in INR, e.g. 450 -> "₹450". */
export function formatINR(amount: number): string {
  return currencyFormatter.format(amount);
}

/** Format INR and always show paise, e.g. 450.5 -> "₹450.50". */
export function formatINRDetails(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Enabled only when a valid Razorpay key is configured. */
export function isRazorpayConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET,
  );
}

/** Plain `₹450` size token for compact UI. */
export function formatINRCompact(amount: number): string {
  return `${businessConfig.currencySymbol}${formatNumber(amount)}`;
}

/** Locale-aware number formatting (Indian grouping). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(
    value,
  );
}

export function formatWeight(weight: number, unit = "g"): string {
  return `${formatNumber(weight)} ${unit}`;
}