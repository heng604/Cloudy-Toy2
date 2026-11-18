// Admin controls per member (table public.site_settings, key = "member_overrides"): a fixed level and/or specials switched off.
import { db, must } from "./db";
export type MemberOverride = { tierId?: string; blocked?: boolean; removed?: boolean; added?: boolean; name?: string; phone?: string; /** points the admin added (or took off) by hand, on top of the points earned from paid orders */ bonus?: number; /** the last admin point changes: date, amount, note */ log?: { at: string; delta: number; note: string }[] };
let cache: { at: number; v: Record<string, MemberOverride> } | null = null;
export async function getOverrides(): Promise<Record<string, MemberOverride>> {
  if (cache && Date.now() - cache.at < 10_000) return cache.v;
  try {
    const r = must(await db().from("site_settings").select("value").eq("key", "member_overrides").maybeSingle()) as { value: Record<string, MemberOverride> } | null;
    const v = r?.value && typeof r.value === "object" ? r.value : {}; cache = { at: Date.now(), v }; return v;
  } catch { return {}; }
}
export async function setOverride(email: string, o: MemberOverride) {
  const cur = { ...(await getOverrides()) }; const key = email.toLowerCase(); const was = cur[key];
  const bonus = o.bonus ?? was?.bonus ?? 0; const log = o.log ?? was?.log ?? []; // point changes are kept when the level or specials are edited
  if (!o.tierId && !o.blocked && !o.removed && !o.added && !bonus) delete cur[key]; else cur[key] = { ...(o.tierId ? { tierId: o.tierId } : {}), ...(o.blocked ? { blocked: true } : {}), ...(o.removed ? { removed: true } : {}), ...(o.added ? { added: true, ...(o.name ? { name: o.name } : {}), ...(o.phone ? { phone: o.phone } : {}) } : {}), ...(bonus ? { bonus } : {}), ...(log.length ? { log: log.slice(-30) } : {}) };
  cache = null; must(await db().from("site_settings").upsert({ key: "member_overrides", value: cur, updated_at: new Date().toISOString() }).select("key").single()); cache = null;
}
