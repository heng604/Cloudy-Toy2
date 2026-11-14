// Membership levels (no I/O). Amounts are integer cents.
// A customer's level is worked out automatically from what they have PAID in total (paid orders, goods only, delivery not counted).
// The admin edits levels and their perks on Admin > Membership; they are stored inside the "promotions" settings (key "membership").
export type PerkKind = "percent" | "amount" | "free_shipping" | "custom";
export const PERK_KINDS: PerkKind[] = ["percent", "amount", "free_shipping", "custom"];
/** One special for a level. percent = % off the order, amount = $ off the order, free_shipping = delivery fee waived,
 *  custom = any other benefit the admin writes in words (birthday gift, priority support ...; the shop gives it by hand). */
export type Perk = { id: string; kind: PerkKind; title: string; percent: number; amountCents: number; minSpendCents: number; active: boolean };
export type Tier = { id: string; name: string; emoji: string; minSpendCents: number; perks: Perk[]; active: boolean };
export const MAX_TIERS = 10, MAX_PERKS = 12;
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
export const DEFAULT_TIERS: Tier[] = [
  { id: "bronze", name: "Bronze", emoji: "🥉", minSpendCents: 7000, perks: [], active: true },
  { id: "platinum", name: "Platinum", emoji: "💎", minSpendCents: 12000, perks: [], active: true },
  { id: "gold", name: "Gold", emoji: "🥇", minSpendCents: 30000, perks: [], active: true },
];
type Checked<T> = { ok: true; value: T } | { ok: false; error: string };
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : NaN; };
const idOk = (v: unknown) => typeof v === "string" && /^[a-z0-9-]{1,24}$/.test(v);
const newId = () => Math.random().toString(36).slice(2, 10);

export function checkPerk(i: { id?: unknown; kind?: unknown; title?: unknown; percent?: unknown; amount?: unknown; minSpend?: unknown; active?: unknown }): Checked<Perk> {
  const kind = i.kind as PerkKind, title = String(i.title ?? "").trim();
  if (!PERK_KINDS.includes(kind)) return { ok: false, error: "Choose a special type" };
  if (title.length < 2 || title.length > 60) return { ok: false, error: "Special name needs 2 to 60 characters" };
  const minSpendCents = Math.round(num(i.minSpend ?? 0) * 100);
  if (!Number.isFinite(minSpendCents) || minSpendCents < 0 || minSpendCents > 10_000_000) return { ok: false, error: "Minimum order must be $0 or more" };
  const base = { id: idOk(i.id) ? String(i.id) : newId(), kind, title, percent: 0, amountCents: 0, minSpendCents, active: i.active !== false };
  if (kind === "percent") { const percent = num(i.percent); if (!Number.isInteger(percent) || percent < 1 || percent > 90) return { ok: false, error: "Discount % must be a whole number from 1 to 90" }; return { ok: true, value: { ...base, percent } }; }
  if (kind === "amount") { const amountCents = Math.round(num(i.amount) * 100); if (!Number.isFinite(amountCents) || amountCents < 1 || amountCents > 10_000_000) return { ok: false, error: "Discount amount must be more than $0" }; if (minSpendCents > 0 && amountCents >= minSpendCents) return { ok: false, error: "Discount amount must be smaller than the minimum order" }; return { ok: true, value: { ...base, amountCents } }; }
  return { ok: true, value: base };
}
/** Validates one level (dollars in, cents out). */
export function checkTier(i: { id?: unknown; name?: unknown; emoji?: unknown; minSpend?: unknown; perks?: unknown; active?: unknown }): Checked<Tier> {
  const name = String(i.name ?? "").trim(), emoji = String(i.emoji ?? "").trim(), minSpendCents = Math.round(num(i.minSpend) * 100);
  if (name.length < 2 || name.length > 30) return { ok: false, error: "Level name needs 2 to 30 characters" };
  if (emoji.length > 8) return { ok: false, error: "Icon can be one emoji" };
  if (!Number.isFinite(minSpendCents) || minSpendCents < 1 || minSpendCents > 100_000_000) return { ok: false, error: "Spend to reach this level must be more than $0" };
  const raw = Array.isArray(i.perks) ? i.perks : []; if (raw.length > MAX_PERKS) return { ok: false, error: `At most ${MAX_PERKS} specials per level` };
  const perks: Perk[] = [];
  for (const p of raw) { const c = checkPerk((p ?? {}) as Record<string, unknown>); if (!c.ok) return c; perks.push(c.value); }
  return { ok: true, value: { id: idOk(i.id) ? String(i.id) : newId(), name, emoji, minSpendCents, perks, active: i.active !== false } };
}
/** Reads whatever is stored (missing, old or hand-edited) and always returns valid levels. Never saved = the three default levels; saved empty = no levels. */
export function normalizeTiers(v: unknown): Tier[] {
  if (!Array.isArray(v)) return DEFAULT_TIERS.map((t) => ({ ...t, perks: [] }));
  const out: Tier[] = [];
  for (const x of v) {
    const t = (x ?? {}) as Partial<Tier>;
    const c = checkTier({ id: t.id, name: t.name, emoji: t.emoji, minSpend: (t.minSpendCents ?? 0) / 100, active: t.active, perks: (Array.isArray(t.perks) ? t.perks : []).map((p) => { const q = (p ?? {}) as Partial<Perk>; return { id: q.id, kind: q.kind, title: q.title, percent: q.percent, amount: (q.amountCents ?? 0) / 100, minSpend: (q.minSpendCents ?? 0) / 100, active: q.active }; }) });
    if (c.ok && !out.some((o) => o.id === c.value.id)) out.push(c.value);
  }
  return out.slice(0, MAX_TIERS).sort((a, b) => a.minSpendCents - b.minSpendCents);
}
/** Total a customer has paid for goods: PAID orders, delivery not counted. */
export const memberSpendOf = (orders: { paymentStatus: string; totalCents: number; shippingCents: number }[]) => orders.reduce((s, o) => (o.paymentStatus === "PAID" ? s + Math.max(0, o.totalCents - o.shippingCents) : s), 0);
const live = (tiers: Tier[] | undefined) => (tiers ?? []).filter((t) => t.active).sort((a, b) => a.minSpendCents - b.minSpendCents);
/** The highest level the customer has reached (null = not a member yet). */
export function tierFor(spendCents: number, tiers: Tier[] | undefined): Tier | null { let hit: Tier | null = null; for (const t of live(tiers)) if (spendCents >= t.minSpendCents) hit = t; return hit; }
/** The next level up (null = already at the top). */
export const nextTier = (spendCents: number, tiers: Tier[] | undefined): Tier | null => live(tiers).find((t) => t.minSpendCents > spendCents) ?? null;
/** Words for a special, shown to customers and in the admin list. */
export function perkDetail(p: Perk): string {
  const min = p.minSpendCents > 0 ? ` on orders of ${usd(p.minSpendCents)} or more` : "";
  if (p.kind === "percent") return `${p.percent}% off${p.minSpendCents > 0 ? min : " every order"}`;
  if (p.kind === "amount") return `${usd(p.amountCents)} off${p.minSpendCents > 0 ? min : " every order"}`;
  if (p.kind === "free_shipping") return `Free delivery${p.minSpendCents > 0 ? min : " on every order"}`;
  return p.title;
}
export type MemberDiscount = { id: string; name: string; cents: number };
/** Money specials of a level for one cart. subtotalCents = cart before discounts (used for each special's minimum), leftCents = what is still left to discount after the shop's automatic campaigns. Never takes off more than leftCents. */
export function memberBenefits(tier: Tier | null, cart: { subtotalCents: number; leftCents: number }): { discounts: MemberDiscount[]; freeShipping: boolean } {
  const out: MemberDiscount[] = []; let left = Math.max(0, cart.leftCents), freeShipping = false;
  if (!tier) return { discounts: out, freeShipping };
  for (const p of tier.perks) {
    if (!p.active || cart.subtotalCents < p.minSpendCents) continue;
    if (p.kind === "free_shipping") { freeShipping = true; continue; }
    const want = p.kind === "percent" ? Math.round((cart.subtotalCents * p.percent) / 100) : p.kind === "amount" ? p.amountCents : 0;
    const cents = Math.min(want, left); if (cents > 0) { out.push({ id: `member-${tier.id}-${p.id}`, name: `${tier.name} member: ${p.title}`, cents }); left -= cents; }
  }
  return { discounts: out, freeShipping };
}
