import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import sharp from "sharp";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
const mem = vi.hoisted(() => ({ settings: {} as Record<string, unknown>, promos: { campaigns: [], festivals: [] } as unknown, uploaded: [] as string[], deleted: [] as string[] }));
vi.mock("../server/lib/auth", () => { const pass = (_q: unknown, _s: unknown, n: () => void) => n(); return { requireAdmin: pass, requireUser: pass, userFromReq: () => null, adminOf: () => ({ email: "a@b.c", user_metadata: {} }), userOf: () => ({ email: "a@b.c" }), needs: () => pass, roleOf: () => "owner" }; });
vi.mock("../server/lib/settings", async () => { const { DEFAULT_SETTINGS } = await import("../shared/types"); return { DEFAULT_SETTINGS, beatWatcher: () => undefined, watcherSeenAt: async () => null,
  getSettings: async () => ({ ...DEFAULT_SETTINGS, ...mem.settings }), saveSettings: async (p: Record<string, unknown>) => { Object.assign(mem.settings, p); } }; });
vi.mock("../server/lib/productStore", async (orig) => ({ ...(await orig<object>()), uploadProductImage: async (n: string) => { mem.uploaded.push(n); return `/api/img/${n}`; }, deleteProductImages: async (s: string[]) => { mem.deleted.push(...s); },
  categoryCounts: async () => new Map([["Plushies", 2]]) }));
vi.mock("../server/lib/promotionsStore", () => ({ getPromotions: async () => mem.promos, savePromotions: async (p: unknown) => { mem.promos = p; } }));
let server: Server, base = "";
beforeAll(async () => { const { default: app } = await import("../server/app"); server = app.listen(0); base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`; });
afterAll(() => { server?.close(); });
const png = async () => new Blob([new Uint8Array(await sharp({ create: { width: 800, height: 400, channels: 4, background: { r: 120, g: 180, b: 250, alpha: 1 } } }).png().toBuffer())], { type: "image/png" });
const send = async (path: string, fields: Record<string, string>, withFile = true) => { const fd = new FormData(); for (const [k, v] of Object.entries(fields)) fd.set(k, v); if (withFile) fd.set("image", await png(), "pic.png"); const r = await fetch(base + path, { method: "POST", body: fd }); return { status: r.status, body: await r.json().catch(() => null) as Record<string, unknown> | null }; };
describe("admin picture uploads", () => {
  it("Special Offer page banner: hero, mascot, footer save and can be removed", async () => {
    for (const [slot, key] of [["hero", "offerHeroImage"], ["mascot", "offerMascotImage"], ["footer", "offerFooterImage"], ["detail", "offerDetailImage"]] as const) {
      const r = await send("/admin/settings/offer-page", { slot }); expect(r.status, JSON.stringify(r.body)).toBe(200); expect(r.body?.ok, JSON.stringify(r.body)).toBe(true); expect(String(r.body?.url)).toMatch(/^\/api\/img\/offer-[a-z]+-[0-9a-f]{8}\.webp$/); expect(mem.settings[key]).toBe(r.body?.url);
      const d = await send("/admin/settings/offer-page", { slot, remove: "on" }, false); expect(d.body?.ok, JSON.stringify(d.body)).toBe(true); expect(mem.settings[key]).toBe("");
    }
    expect((await send("/admin/settings/offer-page", { slot: "text", value: "off" }, false)).body?.ok).toBe(true); expect(mem.settings.offerHeroText).toBe(false);
  });
  it("category icon saves and is kept per category", async () => {
    const r = await send("/admin/categories/image", { name: "Plushies" }); expect(r.body?.ok, JSON.stringify(r.body)).toBe(true); expect((mem.settings.categoryImages as Record<string, string>).Plushies).toBe(r.body?.url);
    const n = await send("/admin/categories/image", { name: "__new" }); expect(n.body?.ok, JSON.stringify(n.body)).toBe(true);
  });
  it("offer card picture uploads and returns its address", async () => { const r = await send("/admin/promotions/image", {}); expect(r.body?.ok, JSON.stringify(r.body)).toBe(true); expect(String(r.body?.url)).toMatch(/^\/api\/img\/offer-/); });
});
