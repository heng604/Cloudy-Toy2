import { db, must } from "./db";
import { cached, invalidate } from "./cache";
import { allDefs, resolvePage, type PageData, type PagesStore } from "../../shared/pages";
export async function readStore(): Promise<PagesStore> {
  try { return await cached("pages:store", 15_000, async () => { const r = must(await db().from("site_settings").select("value").eq("key", "pages").maybeSingle()) as { value: PagesStore } | null; return r?.value ?? {}; }); } catch { return {}; }
}
async function readFresh(): Promise<PagesStore> { return (must(await db().from("site_settings").select("value").eq("key", "pages").maybeSingle()) as { value: PagesStore } | null)?.value ?? {}; }
async function writeStore(next: PagesStore) {
  must(await db().from("site_settings").upsert({ key: "pages", value: next, updated_at: new Date().toISOString() }).select("key").single());
  invalidate("pages:");
}
export async function getAllPages(): Promise<Record<string, PageData>> {
  const s = await readStore(); const out: Record<string, PageData> = {};
  for (const d of allDefs(s)) out[d.slug] = resolvePage(s, d.slug);
  return out;
}
export async function savePage(slug: string, patch: Partial<PageData>) {
  const fresh = await readFresh();
  await writeStore({ ...fresh, [slug]: { ...fresh[slug], ...patch } });
}
/** Returns false when the web address is already used. */
export async function createCustomPage(slug: string, title: string, content: string): Promise<boolean> {
  const fresh = await readFresh(); if (fresh[slug]) return false;
  await writeStore({ ...fresh, [slug]: { title, content, deleted: false, custom: true } }); return true;
}
/** Custom pages are removed for good (built-in pages are only hidden). */
export async function removeCustomPage(slug: string): Promise<boolean> {
  const fresh = await readFresh(); if (!fresh[slug]?.custom) return false;
  const { [slug]: _gone, ...rest } = fresh; await writeStore(rest); return true;
}
