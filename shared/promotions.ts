// Pure rules for pre-orders and automatic discounts (no I/O). Amounts are integer cents.
// Stored by the admin in site_settings (key "promotions"); the server recomputes everything at checkout.
/** Global pre-order rules. The open date and deadline are NOT here: each pre-order product has its own (see shared/products.ts). */
export type PreorderRules = { depositPercent: number; dispatchText: string; capSlots: number };
export const DEFAULT_PREORDER: PreorderRules = { depositPercent: 50, dispatchText: "10 - 14 Business Days", capSlots: 50 };
import { shopToday } from "./products";
export type CampaignKind = "spend_amount" | "spend_percent" | "category_percent" | "product_percent" | "bogo" | "free_shipping";
export const CAMPAIGN_KINDS: CampaignKind[] = ["spend_amount", "spend_percent", "category_percent", "product_percent", "bogo", "free_shipping"];
/** One automatic promotion rule. Dates are optional (both or none). product_percent = % off the products picked from the database; bogo = buy X of a category/product, get Y of a free bonus product; free_shipping = delivery fee waived (always, over a minimum spend, or over a minimum item count). */
export type Campaign = { id: string; name: string; kind: CampaignKind; minSpendCents: number; amountCents: number; percent: number; category: string; active: boolean; createdAt: string;
  startDate?: string; endDate?: string; productIds?: string[]; buyQty?: number; buyType?: "category" | "product"; buyTarget?: string; getQty?: number; bonusProductId?: string; minQty?: number; area?: "all" | "PHNOM_PENH" };
/** A festival / event special offer (Khmer New Year, Pchum Ben, Christmas ...). The admin writes the promotion text, picks the products and optionally a % off; the shop's "Special Offer" button lists those products. */
export type Festival = { id: string; name: string; nameKm: string; text: string; textKm: string; code?: string; startDate: string; endDate: string; percent: number; productIds: string[]; active: boolean; createdAt: string };
export type Promotions = { preorder: PreorderRules; campaigns: Campaign[]; festivals: Festival[] };
export const DEFAULT_PROMOTIONS: Promotions = { preorder: DEFAULT_PREORDER, campaigns: [], festivals: [] };
export const MAX_CAMPAIGNS = 20;
export const MAX_FESTIVALS = 20;
export const MAX_FESTIVAL_PRODUCTS = 500;
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
const int = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : NaN; };

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };
/** Validates the "Pre-Order Global Rules" form. */
export function checkPreorder(i: { depositPercent: unknown; dispatchText: unknown; capSlots: unknown }): Checked<PreorderRules> {
  const depositPercent = int(i.depositPercent), capSlots = int(i.capSlots), dispatchText = String(i.dispatchText ?? "").trim();
  if (!Number.isInteger(depositPercent) || depositPercent < 1 || depositPercent > 100) return { ok: false, error: "Required deposit must be a whole number from 1 to 100" };
  if (dispatchText.length < 2 || dispatchText.length > 60) return { ok: false, error: "Estimated dispatch timeline needs 2 to 60 characters (e.g. 10 - 14 Business Days)" };
  if (!Number.isInteger(capSlots) || capSlots < 1 || capSlots > 100000) return { ok: false, error: "Pre-order cap slot limit must be a whole number from 1 to 100000" };
  return { ok: true, value: { depositPercent, dispatchText, capSlots } };
}
const isoDay0 = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
/** Validates the "Create Promotion Rule" form (dollars in, cents out). */
export function checkCampaign(i: { name: unknown; kind: unknown; minSpend?: unknown; amount?: unknown; percent?: unknown; category?: unknown; startDate?: unknown; endDate?: unknown; productIds?: unknown; buyQty?: unknown; buyType?: unknown; buyTarget?: unknown; getQty?: unknown; bonusProductId?: unknown; minQty?: unknown; area?: unknown }): Checked<Omit<Campaign, "id" | "active" | "createdAt">> {
  const name = String(i.name ?? "").trim(), kind = i.kind as CampaignKind;
  if (name.length < 2 || name.length > 60) return { ok: false, error: "Campaign name needs 2 to 60 characters" };
  if (!CAMPAIGN_KINDS.includes(kind)) return { ok: false, error: "Choose a campaign type" };
  const startDate = String(i.startDate ?? "").trim(), endDate = String(i.endDate ?? "").trim();
  if ((startDate === "") !== (endDate === "")) return { ok: false, error: "Set both the start date and the end date, or leave both empty" };
  if (startDate && (!isoDay0(startDate) || !isoDay0(endDate))) return { ok: false, error: "Dates must be real calendar dates" };
  if (startDate && endDate < startDate) return { ok: false, error: "The end date cannot be before the start date" };
  const usesSpend = kind === "spend_amount" || kind === "spend_percent" || kind === "free_shipping";
  const minSpendCents = usesSpend ? Math.round(int(i.minSpend ?? 0) * 100) : 0, amountCents = Math.round(int(i.amount ?? 0) * 100), percent = int(i.percent ?? 0), category = String(i.category ?? "").trim();
  const base = { name, kind, minSpendCents, amountCents: 0, percent: 0, category: "", startDate, endDate, productIds: [] as string[], buyQty: 0, buyType: "category" as "category" | "product", buyTarget: "", getQty: 0, bonusProductId: "", minQty: 0, area: "all" as "all" | "PHNOM_PENH" };
  if (usesSpend && (!Number.isFinite(minSpendCents) || minSpendCents < 0 || minSpendCents > 10_000_000)) return { ok: false, error: "Minimum spend must be $0 or more" };
  if (kind === "spend_amount") {
    if (!Number.isFinite(amountCents) || amountCents < 1 || amountCents > 10_000_000) return { ok: false, error: "Discount amount must be more than $0" };
    if (minSpendCents > 0 && amountCents >= minSpendCents) return { ok: false, error: "Discount amount must be smaller than the minimum spend" };
    return { ok: true, value: { ...base, amountCents } };
  }
  if (kind === "spend_percent" || kind === "category_percent" || kind === "product_percent") {
    if (!Number.isInteger(percent) || percent < 1 || percent > 90) return { ok: false, error: "Discount % must be a whole number from 1 to 90" };
    if (kind === "category_percent") { if (category.length < 1 || category.length > 40) return { ok: false, error: "Choose the category this discount applies to" }; return { ok: true, value: { ...base, percent, category } }; }
    if (kind === "product_percent") {
      const ids = [...new Set((Array.isArray(i.productIds) ? i.productIds : []).map((x) => String(x)).filter((x) => x.length > 0 && x.length <= 64))];
      if (ids.length < 1) return { ok: false, error: "Pick at least one product for this discount" }; if (ids.length > MAX_FESTIVAL_PRODUCTS) return { ok: false, error: `At most ${MAX_FESTIVAL_PRODUCTS} products per rule` };
      return { ok: true, value: { ...base, percent, productIds: ids } };
    }
    return { ok: true, value: { ...base, percent } };
  }
  if (kind === "bogo") {
    const buyQty = int(i.buyQty), getQty = int(i.getQty), buyType = i.buyType === "product" ? "product" : "category", buyTarget = String(i.buyTarget ?? "").trim(), bonusProductId = String(i.bonusProductId ?? "").trim();
    if (!Number.isInteger(buyQty) || buyQty < 1 || buyQty > 99) return { ok: false, error: "Customer buys qty (X) must be a whole number from 1 to 99" };
    if (!Number.isInteger(getQty) || getQty < 1 || getQty > 20) return { ok: false, error: "Customer gets qty (Y) must be a whole number from 1 to 20" };
    if (buyTarget.length < 1 || buyTarget.length > 64) return { ok: false, error: "Choose the category or product the customer must buy" };
    if (bonusProductId.length < 1 || bonusProductId.length > 64) return { ok: false, error: "Choose the free bonus product" };
    return { ok: true, value: { ...base, buyQty, getQty, buyType, buyTarget, bonusProductId } };
  }
  // free_shipping: always, over a minimum spend, or over a minimum item count
  const cond = String(i.minQty !== undefined && int(i.minQty) > 0 ? "qty" : minSpendCents > 0 ? "spend" : "none"), minQty = cond === "qty" ? int(i.minQty) : 0;
  if (cond === "qty" && (!Number.isInteger(minQty) || minQty < 1 || minQty > 99)) return { ok: false, error: "Minimum item count must be a whole number from 1 to 99" };
  return { ok: true, value: { ...base, minSpendCents: cond === "spend" ? minSpendCents : 0, minQty, area: i.area === "PHNOM_PENH" ? "PHNOM_PENH" : "all" } };
}
/** Reads whatever is stored (old, missing or hand-edited data) and always returns a valid Promotions. */
export function normalizePromotions(v: unknown): Promotions {
  const o = (v && typeof v === "object" ? v : {}) as { preorder?: Partial<PreorderRules>; campaigns?: unknown; festivals?: unknown };
  const pre = checkPreorder({ ...DEFAULT_PREORDER, ...(o.preorder ?? {}) });
  const campaigns = (Array.isArray(o.campaigns) ? o.campaigns : []).flatMap((c): Campaign[] => {
    const x = c as Partial<Campaign>; if (!x || typeof x.id !== "string" || !CAMPAIGN_KINDS.includes(x.kind as CampaignKind)) return [];
    const chk = checkCampaign({ name: x.name, kind: x.kind, minSpend: (x.minSpendCents ?? 0) / 100, amount: (x.amountCents ?? 0) / 100, percent: x.percent, category: x.category, startDate: x.startDate, endDate: x.endDate, productIds: x.productIds, buyQty: x.buyQty, buyType: x.buyType, buyTarget: x.buyTarget, getQty: x.getQty, bonusProductId: x.bonusProductId, minQty: x.minQty, area: x.area });
    return chk.ok ? [{ ...chk.value, id: x.id, active: x.active !== false, createdAt: String(x.createdAt ?? "") }] : [];
  }).slice(0, MAX_CAMPAIGNS);
  const festivals = (Array.isArray(o.festivals) ? o.festivals : []).flatMap((f): Festival[] => {
    const x = f as Partial<Festival>; if (!x || typeof x.id !== "string") return [];
    const chk = checkFestival({ name: x.name, nameKm: x.nameKm, text: x.text, textKm: x.textKm, code: x.code, startDate: x.startDate, endDate: x.endDate, percent: x.percent, productIds: x.productIds });
    return chk.ok ? [{ ...chk.value, id: x.id, active: x.active !== false, createdAt: String(x.createdAt ?? "") }] : [];
  }).slice(0, MAX_FESTIVALS);
  return { preorder: pre.ok ? pre.value : DEFAULT_PREORDER, campaigns, festivals };
}
/** Text shown under the campaign name in the admin list and in the shop. `nameOf` turns a product id into its name (used by Buy X Get Y). */
export function campaignDetail(c: Campaign, nameOf: (id: string) => string = () => "the free gift"): string {
  if (c.kind === "spend_amount") return c.minSpendCents > 0 ? `Orders of ${usd(c.minSpendCents)} or more get ${usd(c.amountCents)} off` : `${usd(c.amountCents)} off every order`;
  if (c.kind === "spend_percent") return c.minSpendCents > 0 ? `Orders of ${usd(c.minSpendCents)} or more get ${c.percent}% off` : `${c.percent}% off every order`;
  if (c.kind === "product_percent") return `${c.percent}% off ${(c.productIds ?? []).length} selected product${(c.productIds ?? []).length === 1 ? "" : "s"}`;
  if (c.kind === "bogo") return `Buy ${c.buyQty ?? 1}${c.buyType === "product" && c.buyTarget ? ` ${nameOf(c.buyTarget)}` : c.buyTarget ? ` ${c.buyTarget}` : ""}, get ${c.getQty ?? 1} ${nameOf(c.bonusProductId ?? "")} FREE`;
  if (c.kind === "free_shipping") { const where = c.area === "PHNOM_PENH" ? "Free Phnom Penh delivery" : "Free delivery"; return (c.minQty ?? 0) > 0 ? `${where} on orders of ${c.minQty} items or more` : c.minSpendCents > 0 ? `${where} on orders of ${usd(c.minSpendCents)} or more` : `${where} on every order`; }
  return `${c.percent}% off all ${c.category} products`;
}
export const campaignLabel = (c: Campaign) => ({ spend_amount: "Spend & Save", spend_percent: "Spend & Save", category_percent: `${c.percent}% OFF Collection`, product_percent: `${c.percent}% OFF Collection`, bogo: "BOGO Bundle", free_shipping: "Free Shipping" })[c.kind];
/** Rule is switched on AND today (shop time) is inside its dates (no dates = always). */
export function campaignLive(c: Pick<Campaign, "active" | "startDate" | "endDate">, now = Date.now()) { if (!c.active) return false; if (!c.startDate || !c.endDate) return true; const d = shopToday(now); return d >= c.startDate && d <= c.endDate; }
export const liveCampaigns = (cs: Campaign[], now = Date.now()) => cs.filter((c) => campaignLive(c, now));
const isoDay = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
/** Validates the "Special Offer / Festival" form. Dates: both or none (none = always on while the offer is switched on). */
export function checkFestival(i: { name: unknown; code?: unknown; nameKm?: unknown; text?: unknown; textKm?: unknown; startDate?: unknown; endDate?: unknown; percent?: unknown; productIds?: unknown }): Checked<Omit<Festival, "id" | "active" | "createdAt">> {
  const name = String(i.name ?? "").trim(), nameKm = String(i.nameKm ?? "").trim(), text = String(i.text ?? "").trim(), textKm = String(i.textKm ?? "").trim();
  const startDate = String(i.startDate ?? "").trim(), endDate = String(i.endDate ?? "").trim(), percent = i.percent === "" || i.percent == null ? 0 : int(i.percent);
  if (name.length < 2 || name.length > 60) return { ok: false, error: "Festival / event name needs 2 to 60 characters" };
  if (nameKm.length > 60) return { ok: false, error: "Khmer name can have at most 60 characters" };
  if (text.length > 600 || textKm.length > 600) return { ok: false, error: "Promotion text can have at most 600 characters" };
  if ((startDate === "") !== (endDate === "")) return { ok: false, error: "Set both the start date and the end date, or leave both empty" };
  if (startDate && (!isoDay(startDate) || !isoDay(endDate))) return { ok: false, error: "Dates must be real calendar dates" };
  if (startDate && endDate < startDate) return { ok: false, error: "The end date cannot be before the start date" };
  if (!Number.isInteger(percent) || percent < 0 || percent > 90) return { ok: false, error: "Discount % must be a whole number from 0 to 90 (0 = no discount, just show the products)" };
  const code = String(i.code ?? "").trim().toUpperCase(); if (code && !/^[A-Z0-9_-]{3,30}$/.test(code)) return { ok: false, error: "Event code needs 3 to 30 letters, numbers, - or _" };
  const ids = Array.isArray(i.productIds) ? i.productIds : [];
  const productIds = [...new Set(ids.map((x) => String(x)).filter((x) => x.length > 0 && x.length <= 64))];
  if (productIds.length > MAX_FESTIVAL_PRODUCTS) return { ok: false, error: `At most ${MAX_FESTIVAL_PRODUCTS} products per offer` };
  return { ok: true, value: { name, nameKm, text, textKm, code, startDate, endDate, percent, productIds } };
}
/** "upcoming" = not started, "live" = shown in the shop now, "ended" = past its end date, "paused" = switched off by the admin. */
export function festivalPhase(f: Pick<Festival, "active" | "startDate" | "endDate">, now = Date.now()): "upcoming" | "live" | "ended" | "paused" {
  if (!f.active) return "paused"; if (!f.startDate || !f.endDate) return "live"; const d = shopToday(now);
  return d < f.startDate ? "upcoming" : d > f.endDate ? "ended" : "live";
}
export const liveFestivals = (festivals: Festival[], now = Date.now()) => festivals.filter((f) => festivalPhase(f, now) === "live");
export const festivalName = (f: Pick<Festival, "name" | "nameKm">, lang: string) => (lang === "km" && f.nameKm ? f.nameKm : f.name);
export const festivalText = (f: Pick<Festival, "text" | "textKm">, lang: string) => (lang === "km" && f.textKm ? f.textKm : f.text);
/** "-15% on the selected products" / "Selected products" for the banner. */
export const festivalDetail = (f: Pick<Festival, "percent" | "productIds">) => (f.percent > 0 ? `${f.percent}% off ${f.productIds.length} selected product${f.productIds.length === 1 ? "" : "s"}` : `${f.productIds.length} selected product${f.productIds.length === 1 ? "" : "s"}`);
export type AutoDiscount = { id: string; name: string; cents: number };
/** Automatic discounts for a cart. All active campaigns that match stack, and never take off more than the subtotal. Delivery is never discounted. */
export function autoDiscounts(lines: { category: string; lineCents: number; productId?: string }[], campaigns: Campaign[], festivals: Festival[] = [], now = Date.now()): AutoDiscount[] {
  const subtotal = lines.reduce((s, l) => s + l.lineCents, 0); let left = subtotal; const out: AutoDiscount[] = [];
  for (const c of liveCampaigns(campaigns, now)) {
    let cents = 0;
    if (c.kind === "spend_amount") cents = subtotal >= c.minSpendCents ? c.amountCents : 0;
    else if (c.kind === "spend_percent") cents = subtotal >= c.minSpendCents ? Math.round((subtotal * c.percent) / 100) : 0;
    else if (c.kind === "category_percent") { const base = lines.filter((l) => l.category.trim().toLowerCase() === c.category.trim().toLowerCase()).reduce((s, l) => s + l.lineCents, 0); cents = Math.round((base * c.percent) / 100); }
    else if (c.kind === "product_percent") { const ids = new Set(c.productIds ?? []); const base = lines.filter((l) => l.productId && ids.has(l.productId)).reduce((s, l) => s + l.lineCents, 0); cents = Math.round((base * c.percent) / 100); }
    cents = Math.min(cents, left); if (cents > 0) { out.push({ id: c.id, name: c.name, cents }); left -= cents; }
  }
  // festival / event special offers: % off the products the admin picked (only while the offer is live)
  for (const f of liveFestivals(festivals, now)) {
    if (f.percent <= 0) continue; const ids = new Set(f.productIds);
    const base = lines.filter((l) => l.productId && ids.has(l.productId)).reduce((s, l) => s + l.lineCents, 0);
    const cents = Math.min(Math.round((base * f.percent) / 100), left); if (cents > 0) { out.push({ id: `fest-${f.id}`, name: f.name, cents }); left -= cents; }
  }
  return out;
}
/** What ONE product costs after the "% off a category" campaigns (the only kind that belongs to a single product). Same maths as autoDiscounts, for one unit.
 *  The shop uses it to show the discounted price on product cards and product pages; the server still recomputes the real total at checkout. */
export function productPromo(p: { id?: string; category?: string; price: number; salePrice?: number | null }, campaigns: Campaign[], festivals: Festival[] = [], now = Date.now()) {
  const cat = (p.category ?? "").trim().toLowerCase();
  const hits = liveCampaigns(campaigns, now).filter((c) => (c.kind === "category_percent" && c.category.trim().toLowerCase() === cat) || (c.kind === "product_percent" && !!p.id && (c.productIds ?? []).includes(p.id)));
  const festivalHits = p.id ? liveFestivals(festivals, now).filter((f) => f.productIds.includes(p.id!)) : [];
  const baseCents = Math.round((p.salePrice ?? p.price) * 100); let left = baseCents, offCents = 0;
  for (const c of hits) { const x = Math.min(Math.round((baseCents * c.percent) / 100), left); offCents += x; left -= x; }
  for (const f of festivalHits) { const x = Math.min(Math.round((baseCents * f.percent) / 100), left); offCents += x; left -= x; }
  return { hits, festivalHits, baseCents, offCents, finalCents: baseCents - offCents, percent: baseCents > 0 ? Math.round((offCents * 100) / baseCents) : 0 };
}
/** Is this product part of the shop's "Special Offer" list? (sale price, a category discount, or picked for a live festival / event) */
export const inSpecialOffer = (p: Parameters<typeof productPromo>[0], campaigns: Campaign[], festivals: Festival[], now = Date.now()) => { const x = productPromo(p, campaigns, festivals, now); return p.salePrice != null || x.offCents > 0 || x.festivalHits.length > 0 || liveCampaigns(campaigns, now).some((c) => c.kind === "bogo" && (c.buyType === "product" ? !!p.id && c.buyTarget === p.id : (c.buyTarget ?? "").trim().toLowerCase() === (p.category ?? "").trim().toLowerCase())); };
/** Campaigns that depend on the whole order (spend $X, get Y off) instead of one product. */
export const isProductRule = (c: Campaign) => c.kind === "category_percent" || c.kind === "product_percent";
export const orderCampaigns = (campaigns: Campaign[], now = Date.now()) => liveCampaigns(campaigns, now).filter((c) => !isProductRule(c));
/** Buy X Get Y: free bonus items earned by a cart. Whole multiples only (buy 4 with "buy 2 get 1" = 2 free). */
export type Gift = { campaignId: string; name: string; productId: string; qty: number };
export function bogoGifts(lines: { productId: string; category: string; qty: number }[], campaigns: Campaign[], now = Date.now()): Gift[] {
  const out: Gift[] = [];
  for (const c of liveCampaigns(campaigns, now)) {
    if (c.kind !== "bogo" || !c.buyQty || !c.getQty || !c.bonusProductId) continue;
    const have = lines.filter((l) => (c.buyType === "product" ? l.productId === c.buyTarget : l.category.trim().toLowerCase() === (c.buyTarget ?? "").trim().toLowerCase())).reduce((n, l) => n + l.qty, 0);
    const qty = Math.min(Math.floor(have / c.buyQty) * c.getQty, 99); if (qty > 0) out.push({ campaignId: c.id, name: c.name, productId: c.bonusProductId, qty });
  }
  return out;
}
/** The first live free-shipping rule this cart qualifies for (or null). Compared with the subtotal BEFORE discounts. */
export function freeShippingRule(cart: { subtotalCents: number; qty: number; area: string }, campaigns: Campaign[], now = Date.now()): Campaign | null {
  return liveCampaigns(campaigns, now).find((c) => c.kind === "free_shipping" && (c.area !== "PHNOM_PENH" || cart.area === "PHNOM_PENH") && ((c.minQty ?? 0) > 0 ? cart.qty >= c.minQty! : cart.subtotalCents >= c.minSpendCents)) ?? null;
}
export const autoTotal = (d: AutoDiscount[]) => d.reduce((s, x) => s + x.cents, 0);
/** Pre-order orders pay only this deposit now (or the full price when `full` is true: the customer's choice at checkout); any rest is paid when the order is dispatched. */
export function preorderSplit(totalCents: number, rules: PreorderRules, full = false) {
  const depositCents = full ? totalCents : Math.min(totalCents, Math.max(1, Math.ceil((totalCents * rules.depositPercent) / 100)));
  return { percent: full ? 100 : rules.depositPercent, ...(full ? { full: true } : {}), depositCents, balanceCents: totalCents - depositCents, dispatch: rules.dispatchText };
}
