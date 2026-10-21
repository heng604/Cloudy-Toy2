// Site settings in Supabase (table public.site_settings, key = "main"). Short in-memory cache, cleared on every save.
import { db, must } from "./db";
import { DEFAULT_SETTINGS, type Settings } from "../../shared/types";
export { DEFAULT_SETTINGS };
let cache: { at: number; v: Settings } | null = null;
export async function getSettings(): Promise<Settings> {
  if (cache && Date.now() - cache.at < 15_000) return cache.v;
  try {
    const r = must(await db().from("site_settings").select("value").eq("key", "main").maybeSingle()) as { value: Partial<Settings> } | null;
    const v = { ...DEFAULT_SETTINGS, ...(r?.value ?? {}) }; if (!Array.isArray(v.banners)) v.banners = [];
    cache = { at: Date.now(), v }; return v;
  } catch { return DEFAULT_SETTINGS; }
}
export async function saveSettings(patch: Partial<Settings>) {
  cache = null;
  const next = { ...(await getSettings()), ...patch };
  must(await db().from("site_settings").upsert({ key: "main", value: next, updated_at: new Date().toISOString() }).select("key").single());
  cache = null;
}
