export const businessConfig = {
  currency: "INR",
  currencySymbol: "₹",
  // Shipping rules. Values are in the base currency (INR).
  shipping: {
    freeShippingAbove: 500, // Free shipping when subtotal >= this amount
    flatShippingCharge: 49, // Flat shipping below the free threshold
  },
  // Payment methods
  payments: {
    codEnabled: true, // Master toggle for Cash on Delivery
    codEnabledLabel: "Code",
  },
  // Inventory
  inventory: {
    lowStockThresholdDefault: 10,
  },
  store: {
    maxOrderQuantityPerItem: 99,
  },
} as const;

export type BusinessConfig = typeof businessConfig;