// Pure discount rules (no I/O). Amounts are integer cents. Delivery is never discounted.
// Admin sets a % (10-50) and a code on a product. Customers get that % off the product ONLY by entering the code.
export const MIN_PERCENT = 10, MAX_PERCENT = 50;
export const percentOk = (n: number) => Number.isInteger(n) && n >= MIN_PERCENT && n <= MAX_PERCENT;
export const CODE_RE = /^[A-Z0-9_-]{3,30}$/;
export const normalizeCode = (s: string) => s.trim().toUpperCase();
export type DiscountResult = { ok: true; discountCents: number } | { ok: false; error: string };
/** Each cart line whose product owns the code gets its own % off. Other lines stay at full price. */
export function productCodeDiscount(items: { productId: string; lineCents: number }[], percentByProduct: Map<string, number>): DiscountResult {
  const cents = items.reduce((s, i) => { const pct = percentByProduct.get(i.productId); return pct ? s + Math.round((i.lineCents * pct) / 100) : s; }, 0);
  return cents > 0 ? { ok: true, discountCents: cents } : { ok: false, error: "That discount code is not valid for the items in your cart." };
}
