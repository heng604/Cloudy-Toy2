import { describe, it, expect } from "vitest";
import { allDefs, customLinks, hiddenFrom, isSlug, resolvePage, SLUG_RE, type PagesStore } from "../shared/pages";
const store: PagesStore = { "gift-guide": { title: "Gift Guide", content: "## Hi", deleted: false, custom: true }, old: { title: "Old", content: "x", deleted: true, custom: true }, contact: { deleted: true } };
describe("custom pages", () => {
  it("lists built-in pages first, then custom ones", () => { const d = allDefs(store).map((x) => x.slug); expect(d.slice(0, 4)).toEqual(["about", "contact", "shipping", "preorder"]); expect(d.slice(4)).toEqual(["gift-guide", "old"]); });
  it("only live custom pages become footer links", () => { expect(customLinks(store)).toEqual([{ slug: "gift-guide", title: "Gift Guide" }]); });
  it("knows which slugs exist", () => { expect(isSlug("about")).toBe(true); expect(isSlug("gift-guide", store)).toBe(true); expect(isSlug("nope", store)).toBe(false); });
  it("resolves title and content", () => { expect(resolvePage(store, "gift-guide")).toMatchObject({ title: "Gift Guide", content: "## Hi", custom: true }); expect(resolvePage(store, "about").custom).toBe(false); expect(resolvePage(store, "missing").custom).toBe(false); });
  it("keeps hiding built-in pages", () => { expect(hiddenFrom(store)).toEqual(["contact"]); });
  it("validates web addresses", () => { expect(SLUG_RE.test("gift-guide-2026")).toBe(true); for (const bad of ["Gift", "a b", "-a", "a--b", "a/b"]) expect(SLUG_RE.test(bad)).toBe(false); });
});
