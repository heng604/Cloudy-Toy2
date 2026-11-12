// Pure rules for pre-orders and automatic discounts (no I/O). Amounts are integer cents.
// Stored by the admin in site_settings (key "promotions"); the server recomputes everything at checkout.
/** Global pre-order rules. The open date and deadline are NOT here: each pre-order product has its own (see shared/products.ts). */
export type PreorderRules = { depositPercent: number; dispatchText: string; capSlots: number };
export const DEFAULT_PREORDER: PreorderRules = { depositPercent: 50, dispatchText: "10 - 14 Business Days", capSlots: 50 };
import { shopToday, dayShort } from "./products";
/** "product_percent" = Special Offer for a festival / event: the admin ticks the products and they get % off. */
export type CampaignKind = "spend_amount" | "spend_percent" | "category_percent" | "product_percent";
export const CAMPAIGN_KINDS: CampaignKind[] = ["spend_amount", "spend_percent", "category_percent", "product_percent"];
/** message / messageKm = the promotion text the admin writes for the festival (shown in the shop). startDate / endDate (YYYY-MM-DD, both optional) = when the offer is live; empty = always while Active. */
export type Campaign = { id: string; name: string; kind: CampaignKind; minSpendCents: number; amountCents: number; percent: number; category: string; active: boolean; createdAt: string; productIds?: string[]; message?: string; messageKm?: string; startDate?: string; endDate?: string };
export type Promotions = { preorder: PreorderRules; campaigns: Campaign[] };
export const DEFAULT_PROMOTIONS: Promotions = { preorder: DEFAULT_PREORDER, campaigns: [] };
export const MAX_CAMPAIGNS = 20;
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
/** Validates the "Add Campaign" form (dollars in, cents out). */
const isoDay = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
export function checkCampaign(i: { name: unknown; kind: unknown; minSpend?: unknown; amount?: unknown; percent?: unknown; category?: unknown; productIds?: unknown; message?: unknown; messageKm?: unknown; startDate?: unknown; endDate?: unknown }): Checked<Omit<Campaign, "id" | "active" | "createdAt">> {
  const name = String(i.name ?? "").trim(), kind = i.kind as CampaignKind;
  if (name.length < 2 || name.length > 60) return { ok: false, error: "Campaign name needs 2 to 60 characters" };
  if (!CAMPAIGN_KINDS.includes(kind)) return { ok: false, error: "Choose a campaign type" };
  const perItem = kind === "category_percent" || kind === "product_percent";
  const minSpendCents = perItem ? 0 : Math.round(int(i.minSpend ?? 0) * 100), amountCents = Math.round(int(i.amount ?? 0) * 100), percent = int(i.percent ?? 0), category = String(i.category ?? "").trim();
  if (!perItem && (!Number.isFinite(minSpendCents) || minSpendCents < 0 || minSpendCents > 10_000_000)) return { ok: false, error: "Minimum spend must be $0 or more" };
  if (kind === "spend_amount" && (!Number.isFinite(amountCents) || amountCents < 1 || amountCents > 10_000_000)) return { ok: false, error: "Discount amount must be more than $0" };
  if (kind === "spend_amount" && minSpendCents > 0 && amountCents >= minSpendCents) return { ok: false, error: "Discount amount must be smaller than the minimum spend" };
  if (kind !== "spend_amount" && (!Number.isInteger(percent) || percent < 1 || percent > 90)) return { ok: false, error: "Discount % must be a whole number from 1 to 90" };
  if (kind === "category_percent" && (category.length < 1 || category.length > 40)) return { ok: false, error: "Choose the category this discount applies to" };
  const productIds = kind === "product_percent" ? [...new Set((Array.isArray(i.productIds) ? i.productIds : []).map((x) => String(x).trim()).filter((x) => x.length > 0 && x.length <= 64))].slice(0, 500) : [];
  if (kind === "product_percent" && productIds.length < 1) return { ok: false, error: "Tick at least one product for this special offer" };
  const message = String(i.message ?? "").trim(), messageKm = String(i.messageKm ?? "").trim();
  if (message.length > 300 || messageKm.length > 300) return { ok: false, error: "The promotion text can be at most 300 characters" };
  const startDate = String(i.startDate ?? "").trim(), endDate = String(i.endDate ?? "").trim();
  if ((startDate && !isoDay(startDate)) || (endDate && !isoDay(endDate))) return { ok: false, error: "Offer dates must be real calendar dates" };
  if (startDate && endDate && endDate < startDate) return { ok: false, error: "The offer end date cannot be before the start date" };
  return { ok: true, value: { name, kind, minSpendCents, amountCents: kind === "spend_amount" ? amountCents : 0, percent: kind === "spend_amount" ? 0 : percent, category: kind === "category_percent" ? category : "", productIds, message, messageKm, startDate, endDate } };
}
/** Reads whatever is stored (old, missing or hand-edited data) and always returns a valid Promotions. */
export function normalizePromotions(v: unknown): Promotions {
  const o = (v && typeof v === "object" ? v : {}) as { preorder?: Partial<PreorderRules>; campaigns?: unknown };
  const pre = checkPreorder({ ...DEFAULT_PREORDER, ...(o.preorder ?? {}) });
  const campaigns = (Array.isArray(o.campaigns) ? o.campaigns : []).flatMap((c): Campaign[] => {
    const x = c as Partial<Campaign>; if (!x || typeof x.id !== "string" || !CAMPAIGN_KINDS.includes(x.kind as CampaignKind)) return [];
    const chk = checkCampaign({ name: x.name, kind: x.kind, minSpend: (x.minSpendCents ?? 0) / 100, amount: (x.amountCents ?? 0) / 100, percent: x.percent, category: x.category, productIds: x.productIds, message: x.message, messageKm: x.messageKm, startDate: x.startDate, endDate: x.endDate });
    return chk.ok ? [{ ...chk.value, id: x.id, active: x.active !== false, createdAt: String(x.createdAt ?? "") }] : [];
  }).slice(0, MAX_CAMPAIGNS);
  return { preorder: pre.ok ? pre.value : DEFAULT_PREORDER, campaigns };
}
/** Text shown under the campaign name in the admin list and in the shop. */
export function campaignDetail(c: Campaign): string {
  if (c.kind === "spend_amount") return c.minSpendCents > 0 ? `Orders of ${usd(c.minSpendCents)} or more get ${usd(c.amountCents)} off` : `${usd(c.amountCents)} off every order`;
  if (c.kind === "spend_percent") return c.minSpendCents > 0 ? `Orders of ${usd(c.minSpendCents)} or more get ${c.percent}% off` : `${c.percent}% off every order`;
  if (c.kind === "product_percent") return `${c.percent}% off ${c.productIds?.length ?? 0} selected product${c.productIds?.length === 1 ? "" : "s"}`;
  return `${c.percent}% off all ${c.category} products`;
}
/** An offer is live when it is Active AND today (shop time, Cambodia) is inside its optional start / end dates. */
export const campaignLive = (c: Campaign, now = Date.now()) => { if (!c.active) return false; const d = shopToday(now); return (!c.startDate || d >= c.startDate) && (!c.endDate || d <= c.endDate); };
export const liveCampaigns = (campaigns: Campaign[], now = Date.now()) => campaigns.filter((c) => campaignLive(c, now));
/** "1 Nov 2026 to 15 Nov 2026", "From 1 Nov 2026", "Until 15 Nov 2026" or "" (no dates). */
export const campaignWhen = (c: Campaign) => (c.startDate && c.endDate ? `${dayShort(c.startDate)} to ${dayShort(c.endDate)}` : c.startDate ? `From ${dayShort(c.startDate)}` : c.endDate ? `Until ${dayShort(c.endDate)}` : "");
/** The festival promotion text the admin wrote (Khmer when the shop is in Khmer and a Khmer text exists). */
export const campaignMessage = (c: Campaign, lang: string) => (lang === "km" && c.messageKm ? c.messageKm : c.message ?? "");
export type AutoDiscount = { id: string; name: string; cents: number };
/** Automatic discounts for a cart. All active campaigns that match stack, and never take off more than the subtotal. Delivery is never discounted. */
export function autoDiscounts(lines: { category: string; lineCents: number; productId?: string }[], campaigns: Campaign[], now = Date.now()): AutoDiscount[] {
  const subtotal = lines.reduce((s, l) => s + l.lineCents, 0); let left = subtotal; const out: AutoDiscount[] = [];
  for (const c of campaigns) {
    if (!campaignLive(c, now)) continue; let cents = 0;
    if (c.kind === "spend_amount") cents = subtotal >= c.minSpendCents ? c.amountCents : 0;
    else if (c.kind === "spend_percent") cents = subtotal >= c.minSpendCents ? Math.round((subtotal * c.percent) / 100) : 0;
    else if (c.kind === "product_percent") { const ids = new Set(c.productIds ?? []); const base = lines.filter((l) => !!l.productId && ids.has(l.productId)).reduce((s, l) => s + l.lineCents, 0); cents = Math.round((base * c.percent) / 100); }
    else { const base = lines.filter((l) => l.category.trim().toLowerCase() === c.category.trim().toLowerCase()).reduce((s, l) => s + l.lineCents, 0); cents = Math.round((base * c.percent) / 100); }
    cents = Math.min(cents, left); if (cents > 0) { out.push({ id: c.id, name: c.name, cents }); left -= cents; }
  }
  return out;
}
/** What ONE product costs after the "% off a category" and "Special Offer" (chosen products) campaigns (the kinds that belong to single products). Same maths as autoDiscounts, for one unit.
 *  The shop uses it to show the discounted price on product cards and product pages; the server still recomputes the real total at checkout. */
export function productPromo(p: { id?: string; category?: string; price: number; salePrice?: number | null }, campaigns: Campaign[], now = Date.now()) {
  const cat = (p.category ?? "").trim().toLowerCase();
  const hits = campaigns.filter((c) => campaignLive(c, now) && ((c.kind === "category_percent" && c.category.trim().toLowerCase() === cat) || (c.kind === "product_percent" && !!p.id && !!c.productIds?.includes(p.id))));
  const baseCents = Math.round((p.salePrice ?? p.price) * 100); let left = baseCents, offCents = 0;
  for (const c of hits) { const x = Math.min(Math.round((baseCents * c.percent) / 100), left); offCents += x; left -= x; }
  return { hits, baseCents, offCents, finalCents: baseCents - offCents, percent: baseCents > 0 ? Math.round((offCents * 100) / baseCents) : 0 };
}
/** Campaigns that depend on the whole order (spend $X, get Y off) instead of one product. */
export const orderCampaigns = (campaigns: Campaign[], now = Date.now()) => campaigns.filter((c) => campaignLive(c, now) && (c.kind === "spend_amount" || c.kind === "spend_percent"));
export const autoTotal = (d: AutoDiscount[]) => d.reduce((s, x) => s + x.cents, 0);
/** Pre-order orders pay only this deposit now (or the full price when `full` is true: the customer's choice at checkout); any rest is paid when the order is dispatched. */
export function preorderSplit(totalCents: number, rules: PreorderRules, full = false) {
  const depositCents = full ? totalCents : Math.min(totalCents, Math.max(1, Math.ceil((totalCents * rules.depositPercent) / 100)));
  return { percent: full ? 100 : rules.depositPercent, ...(full ? { full: true } : {}), depositCents, balanceCents: totalCents - depositCents, dispatch: rules.dispatchText };
}
