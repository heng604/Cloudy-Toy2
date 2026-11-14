// Admin controls per member (table public.site_settings, key = "member_overrides"): a fixed level and/or specials switched off.
import { db, must } from "./db";
export type MemberOverride = { tierId?: string; blocked?: boolean };
let cache: { at: number; v: Record<string, MemberOverride> } | null = null;
export async function getOverrides(): Promise<Record<string, MemberOverride>> {
  if (cache && Date.now() - cache.at < 10_000) return cache.v;
  try {
    const r = must(await db().from("site_settings").select("value").eq("key", "member_overrides").maybeSingle()) as { value: Record<string, MemberOverride> } | null;
    const v = r?.value && typeof r.value === "object" ? r.value : {}; cache = { at: Date.now(), v }; return v;
  } catch { return {}; }
}
export async function setOverride(email: string, o: MemberOverride) {
  const cur = { ...(await getOverrides()) }; const key = email.toLowerCase();
  if (!o.tierId && !o.blocked) delete cur[key]; else cur[key] = { ...(o.tierId ? { tierId: o.tierId } : {}), ...(o.blocked ? { blocked: true } : {}) };
  cache = null; must(await db().from("site_settings").upsert({ key: "member_overrides", value: cur, updated_at: new Date().toISOString() }).select("key").single()); cache = null;
}
