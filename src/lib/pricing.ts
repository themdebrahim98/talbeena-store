/** Pure money math for the store. No I/O — kept deliberately side-effect free. */

/** Round to paise (2 decimal places) for all storefront math. */
export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface PricedLine {
  quantity: number;
  unitPrice: number;
}

/** Compute total for a single cart/order line. */
export function lineTotal(line: PricedLine): number {
  return roundMoney(line.quantity * line.unitPrice);
}

/** Sum a set of lines into a subtotal. */
export function computeSubtotal(lines: PricedLine[]): number {
  return roundMoney(lines.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0));
}

/** Whole-number discount percentage, e.g. 399/499 -> 20. */
export function discountPercent(
  price: number,
  compareAtPrice: number | null,
): number | null {
  if (!compareAtPrice || compareAtPrice <= price || compareAtPrice <= 0) {
    return null;
  }
  return Math.round((1 - price / compareAtPrice) * 100);
}

/** Per-unit savings vs the compare-at price. */
export function savingsPerUnit(
  price: number,
  compareAtPrice: number | null,
): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return roundMoney(compareAtPrice - price);
}