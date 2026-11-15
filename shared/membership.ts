// Membership levels (no I/O). Amounts are integer cents.
// A customer's level is worked out automatically from what they have PAID in total (paid orders, goods only, delivery not counted).
// The admin edits levels and their perks on Admin > Membership; they are stored inside the "promotions" settings (key "membership").
export type PerkKind = "percent" | "amount" | "free_shipping" | "custom";
export const PERK_KINDS: PerkKind[] = ["percent", "amount", "free_shipping", "custom"];
/** One special for a level. percent = % off the order, amount = $ off the order, free_shipping = delivery fee waived,
 *  custom = any other benefit the admin writes in words (birthday gift, priority support ...; the shop gives it by hand). */
export type Perk = { id: string; kind: PerkKind; title: string; percent: number; amountCents: number; minSpendCents: number; active: boolean; /** most times a member may use this special per calendar month (0 = no limit) */ monthlyLimit: number };
/** A level. The FIRST level (lowest) is reached by paying `minSpendCents` in total. After that the customer earns points (1 point per `memberPointCents` paid, default $10).
 *  Every later level needs `pointsMore` MORE points than the level before it; its `minSpendCents` is worked out from that (see layoutTiers), so the rest of the shop keeps using plain spend. */
export type Tier = { id: string; name: string; emoji: string; image: string; minSpendCents: number; pointsMore: number; perks: Perk[]; active: boolean };
export const MAX_TIERS = 10, MAX_PERKS = 12, MAX_MONTHLY_LIMIT = 999, MAX_POINTS_MORE = 100_000;
/** Dollars paid for 1 point (default $10, in cents). The admin can change it on Admin > Membership. */
export const DEFAULT_POINT_CENTS = 1000;
export const isPointCents = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 100 && n <= 10_000_000;
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
/** Gives every level after the first its spend: previous level's spend + pointsMore x point price. The first level keeps its own spend and has pointsMore 0. */
export function layoutTiers(tiers: Tier[], pointCents: number = DEFAULT_POINT_CENTS): Tier[] {
  const out: Tier[] = [];
  tiers.forEach((t, i) => { const prev = out[i - 1]; out.push(i === 0 || !prev ? { ...t, pointsMore: 0 } : { ...t, pointsMore: Math.max(1, Math.round(t.pointsMore || 1)), minSpendCents: prev.minSpendCents + Math.max(1, Math.round(t.pointsMore || 1)) * pointCents }); });
  return out;
}
/** Bronze at $30 paid, then Silver +10 points, Gold +20 more, Platinum +30 more (1 point = $10 paid after Bronze). */
export const DEFAULT_TIERS: Tier[] = layoutTiers([
  { id: "bronze", name: "Bronze", emoji: "🥉", image: "", minSpendCents: 3000, pointsMore: 0, perks: [], active: true },
  { id: "silver", name: "Silver", emoji: "🥈", image: "", minSpendCents: 0, pointsMore: 10, perks: [], active: true },
  { id: "gold", name: "Gold", emoji: "🥇", image: "", minSpendCents: 0, pointsMore: 20, perks: [], active: true },
  { id: "platinum", name: "Platinum", emoji: "💎", image: "", minSpendCents: 0, pointsMore: 30, perks: [], active: true },
]);
type Checked<T> = { ok: true; value: T } | { ok: false; error: string };
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : NaN; };
const idOk = (v: unknown) => typeof v === "string" && /^[a-z0-9-]{1,24}$/.test(v);
const newId = () => Math.random().toString(36).slice(2, 10);

export function checkPerk(i: { id?: unknown; kind?: unknown; title?: unknown; percent?: unknown; amount?: unknown; minSpend?: unknown; active?: unknown; monthlyLimit?: unknown }): Checked<Perk> {
  const kind = i.kind as PerkKind, title = String(i.title ?? "").trim();
  if (!PERK_KINDS.includes(kind)) return { ok: false, error: "Choose a special type" };
  if (title.length < 2 || title.length > 60) return { ok: false, error: "Special name needs 2 to 60 characters" };
  const minSpendCents = Math.round(num(i.minSpend ?? 0) * 100);
  if (!Number.isFinite(minSpendCents) || minSpendCents < 0 || minSpendCents > 10_000_000) return { ok: false, error: "Minimum order must be $0 or more" };
  const monthlyLimit = i.monthlyLimit === undefined || i.monthlyLimit === "" || i.monthlyLimit === null ? 0 : num(i.monthlyLimit);
  if (!Number.isInteger(monthlyLimit) || monthlyLimit < 0 || monthlyLimit > MAX_MONTHLY_LIMIT) return { ok: false, error: `Monthly limit must be a whole number from 0 to ${MAX_MONTHLY_LIMIT} (0 = no limit)` };
  const base = { id: idOk(i.id) ? String(i.id) : newId(), kind, title, percent: 0, amountCents: 0, minSpendCents, active: i.active !== false, monthlyLimit };
  if (kind === "percent") { const percent = num(i.percent); if (!Number.isInteger(percent) || percent < 1 || percent > 90) return { ok: false, error: "Discount % must be a whole number from 1 to 90" }; return { ok: true, value: { ...base, percent } }; }
  if (kind === "amount") { const amountCents = Math.round(num(i.amount) * 100); if (!Number.isFinite(amountCents) || amountCents < 1 || amountCents > 10_000_000) return { ok: false, error: "Discount amount must be more than $0" }; if (minSpendCents > 0 && amountCents >= minSpendCents) return { ok: false, error: "Discount amount must be smaller than the minimum order" }; return { ok: true, value: { ...base, amountCents } }; }
  return { ok: true, value: base };
}
/** Validates one level (dollars in, cents out). */
export function checkTier(i: { id?: unknown; name?: unknown; emoji?: unknown; image?: unknown; minSpend?: unknown; pointsMore?: unknown; perks?: unknown; active?: unknown }): Checked<Tier> {
  const name = String(i.name ?? "").trim(), emoji = String(i.emoji ?? "").trim();
  const noSpend = i.minSpend === undefined || i.minSpend === null || i.minSpend === "", minSpendCents = noSpend ? 0 : Math.round(num(i.minSpend) * 100);
  const noPoints = i.pointsMore === undefined || i.pointsMore === null || i.pointsMore === "", pointsMore = noPoints ? 0 : num(i.pointsMore);
  if (name.length < 2 || name.length > 30) return { ok: false, error: "Level name needs 2 to 30 characters" };
  if (emoji.length > 8) return { ok: false, error: "Icon can be one emoji" };
  const image = String(i.image ?? "").trim(); if (image.length > 600 || (image && !/^(\/|https?:\/\/)/.test(image))) return { ok: false, error: "Level picture is not valid" };
  if (!noSpend && (!Number.isFinite(minSpendCents) || minSpendCents < 1 || minSpendCents > 100_000_000)) return { ok: false, error: "Spend to reach this level must be more than $0" };
  if (!noPoints && (!Number.isInteger(pointsMore) || pointsMore < 0 || pointsMore > MAX_POINTS_MORE)) return { ok: false, error: "Points needed must be a whole number (1 or more)" };
  const raw = Array.isArray(i.perks) ? i.perks : []; if (raw.length > MAX_PERKS) return { ok: false, error: `At most ${MAX_PERKS} specials per level` };
  const perks: Perk[] = [];
  for (const p of raw) { const c = checkPerk((p ?? {}) as Record<string, unknown>); if (!c.ok) return c; perks.push(c.value); }
  return { ok: true, value: { id: idOk(i.id) ? String(i.id) : newId(), name, emoji, image, minSpendCents, pointsMore, perks, active: i.active !== false } };
}
/** Reads whatever is stored (missing, old or hand-edited) and always returns valid levels in ladder order. Never saved = the four default levels (Bronze, Silver, Gold, Platinum); saved empty = no levels.
 *  Levels saved before points existed have no pointsMore: it is worked out from their old spend amounts, so nobody's level jumps. */
export function normalizeTiers(v: unknown, pointCents: number = DEFAULT_POINT_CENTS): Tier[] {
  if (!Array.isArray(v)) return layoutTiers(DEFAULT_TIERS.map((t) => ({ ...t, perks: [] })), pointCents);
  const out: Tier[] = []; let legacy = false;
  for (const x of v) {
    const t = (x ?? {}) as Partial<Tier>;
    if (typeof t.pointsMore !== "number") legacy = true;
    const c = checkTier({ id: t.id, name: t.name, emoji: t.emoji, image: t.image, minSpend: (t.minSpendCents ?? 0) / 100 || undefined, pointsMore: typeof t.pointsMore === "number" ? t.pointsMore : undefined, active: t.active, perks: (Array.isArray(t.perks) ? t.perks : []).map((p) => { const q = (p ?? {}) as Partial<Perk>; return { id: q.id, kind: q.kind, title: q.title, percent: q.percent, amount: (q.amountCents ?? 0) / 100, minSpend: (q.minSpendCents ?? 0) / 100, active: q.active, monthlyLimit: q.monthlyLimit }; }) });
    if (c.ok && !out.some((o) => o.id === c.value.id)) out.push(c.value);
  }
  if (legacy) { out.sort((a, b) => a.minSpendCents - b.minSpendCents); out.forEach((t, i) => { t.pointsMore = i === 0 ? 0 : Math.max(1, Math.round((t.minSpendCents - out[i - 1].minSpendCents) / pointCents)); }); }
  const kept = out.slice(0, MAX_TIERS); if (kept[0] && kept[0].minSpendCents < 1) kept[0].minSpendCents = DEFAULT_TIERS[0].minSpendCents; // the first level always needs a spend
  return layoutTiers(kept, pointCents);
}
/** Points earned so far: 1 point per `pointCents` paid AFTER the first level's spend (what was paid to join does not count). Not a member yet = 0. */
export function pointsOf(spendCents: number, tiers: Tier[] | undefined, pointCents: number = DEFAULT_POINT_CENTS): number {
  const first = tiers?.[0]; if (!first || spendCents < first.minSpendCents) return 0;
  return Math.floor((spendCents - first.minSpendCents) / pointCents);
}
/** Total points a customer needs to reach this level (first level = 0). */
export const pointsFor = (t: Tier, tiers: Tier[] | undefined, pointCents: number = DEFAULT_POINT_CENTS): number => { const first = tiers?.[0]; return first ? Math.max(0, Math.round((t.minSpendCents - first.minSpendCents) / pointCents)) : 0; };
/** Total a customer has paid for goods: PAID orders, delivery not counted. */
export const memberSpendOf = (orders: { paymentStatus: string; totalCents: number; shippingCents: number }[]) => orders.reduce((s, o) => (o.paymentStatus === "PAID" ? s + Math.max(0, o.totalCents - o.shippingCents) : s), 0);
const live = (tiers: Tier[] | undefined) => (tiers ?? []).filter((t) => t.active).sort((a, b) => a.minSpendCents - b.minSpendCents);
/** The highest level the customer has reached (null = not a member yet). */
export function tierFor(spendCents: number, tiers: Tier[] | undefined): Tier | null { let hit: Tier | null = null; for (const t of live(tiers)) if (spendCents >= t.minSpendCents) hit = t; return hit; }
/** The next level up (null = already at the top). */
export const nextTier = (spendCents: number, tiers: Tier[] | undefined): Tier | null => live(tiers).find((t) => t.minSpendCents > spendCents) ?? null;
/** Words for a special, shown to customers and in the admin list. t = optional translator (English text is the key; {n} / {m} are filled in here). */
type Tr = (s: string, v?: Record<string, string | number>) => string;
const id: Tr = (s, v) => (v ? s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? "")) : s);
export function perkDetail(p: Perk, t: Tr = id): string {
  const ms = p.minSpendCents > 0, m = usd(p.minSpendCents); let base: string;
  if (p.kind === "percent") base = ms ? t("{n}% off on orders of {m} or more", { n: p.percent, m }) : t("{n}% off every order", { n: p.percent });
  else if (p.kind === "amount") base = ms ? t("{n} off on orders of {m} or more", { n: usd(p.amountCents), m }) : t("{n} off every order", { n: usd(p.amountCents) });
  else if (p.kind === "free_shipping") base = ms ? t("Free delivery on orders of {m} or more", { m }) : t("Free delivery on every order");
  else base = p.title;
  return p.monthlyLimit > 0 ? `${base} · ${t("max {n} a month", { n: p.monthlyLimit })}` : base;
}
export type MemberDiscount = { id: string; name: string; cents: number };
/** The shop's calendar month (Phnom Penh time, UTC+7) of a date, e.g. "2026-11". */
export const shopMonth = (d: string | number | Date = Date.now()) => new Date(new Date(d).getTime() + 7 * 3600_000).toISOString().slice(0, 7);
/** How many times each special was used this month: counts orders (not failed / expired / refunded) that recorded the special in memberPerks. */
export function monthUsage(orders: { createdAt?: string; paymentStatus: string; memberPerks?: string[] }[], month = shopMonth()): Record<string, number> {
  const out: Record<string, number> = {};
  for (const o of orders) { if (!o.createdAt || shopMonth(o.createdAt) !== month || ["FAILED", "EXPIRED", "REFUNDED"].includes(o.paymentStatus)) continue; for (const id of o.memberPerks ?? []) out[id] = (out[id] ?? 0) + 1; }
  return out;
}
/** Money specials of a level for one cart. subtotalCents = cart before discounts (used for each special's minimum), leftCents = what is still left to discount after the shop's automatic campaigns. Never takes off more than leftCents. used = times each special was already used this month; a special at its monthly limit is skipped. perks = ids of the specials that applied (recorded on the order so the limit can be counted). */
export function memberBenefits(tier: Tier | null, cart: { subtotalCents: number; leftCents: number }, used: Record<string, number> = {}): { discounts: MemberDiscount[]; freeShipping: boolean; perks: string[]; shipPerks: string[] } {
  const out: MemberDiscount[] = [], perks: string[] = [], shipPerks: string[] = []; let left = Math.max(0, cart.leftCents), freeShipping = false;
  if (!tier) return { discounts: out, freeShipping, perks, shipPerks };
  for (const p of tier.perks) {
    if (!p.active || cart.subtotalCents < p.minSpendCents) continue;
    if (p.monthlyLimit > 0 && (used[p.id] ?? 0) >= p.monthlyLimit) continue;
    if (p.kind === "free_shipping") { freeShipping = true; shipPerks.push(p.id); continue; }
    const want = p.kind === "percent" ? Math.round((cart.subtotalCents * p.percent) / 100) : p.kind === "amount" ? p.amountCents : 0;
    const cents = Math.min(want, left); if (cents > 0) { out.push({ id: `member-${tier.id}-${p.id}`, name: `${tier.name} member: ${p.title}`, cents }); perks.push(p.id); left -= cents; }
  }
  return { discounts: out, freeShipping, perks, shipPerks };
}
