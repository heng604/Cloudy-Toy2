import { describe, it, expect } from "vitest";
import { productPromo } from "../shared/promotions";
import { autoDiscounts, autoTotal, checkCampaign, checkPreorder, normalizePromotions, preorderSplit, DEFAULT_PREORDER, type Campaign } from "../shared/promotions";
import { can, initialsOf } from "../shared/roles";
import { payNowCents } from "../shared/orders";
import { toProduct, nameFor, isPreorder } from "../shared/products";

const spend: Campaign = { id: "a", name: "Spend & Save", kind: "spend_amount", minSpendCents: 2000, amountCents: 500, percent: 0, category: "", active: true, createdAt: "" };
const plush: Campaign = { id: "b", name: "15% Off Plushies", kind: "category_percent", minSpendCents: 0, amountCents: 0, percent: 15, category: "Plushies", active: true, createdAt: "" };

describe("automatic discounts", () => {
  it("stacks matching campaigns", () => {
    const d = autoDiscounts([{ category: "plushies", lineCents: 1500 }, { category: "Other", lineCents: 1000 }], [spend, plush]);
    expect(d.map((x) => x.cents)).toEqual([500, 225]); expect(autoTotal(d)).toBe(725);
  });
  it("needs the minimum spend", () => expect(autoDiscounts([{ category: "Other", lineCents: 1000 }], [spend])).toEqual([]));
  it("never takes off more than the subtotal", () => expect(autoDiscounts([{ category: "x", lineCents: 100 }], [{ ...spend, minSpendCents: 0 }])[0].cents).toBe(100));
  it("ignores paused campaigns", () => expect(autoDiscounts([{ category: "x", lineCents: 5000 }], [{ ...spend, active: false }])).toEqual([]));
});
describe("promotion forms", () => {
  it("validates pre-order rules", () => {
    expect(checkPreorder({ depositPercent: 50, dispatchText: "10 - 14 Business Days", capSlots: 50 }).ok).toBe(true);
    expect(checkPreorder({ depositPercent: 0, dispatchText: "ok text", capSlots: 5 }).ok).toBe(false);
    expect(checkPreorder({ depositPercent: 101, dispatchText: "ok text", capSlots: 5 }).ok).toBe(false);
  });
  it("validates campaigns and converts dollars to cents", () => {
    expect(checkCampaign({ name: "ab", kind: "spend_amount", minSpend: 20, amount: 25 }).ok).toBe(false);
    expect(checkCampaign({ name: "Plush", kind: "category_percent", percent: 15, category: "" }).ok).toBe(false);
    const c = checkCampaign({ name: "Spend & Save", kind: "spend_amount", minSpend: 20, amount: 5 });
    expect(c.ok && c.value).toMatchObject({ minSpendCents: 2000, amountCents: 500 });
  });
  it("repairs stored data", () => {
    const n = normalizePromotions({ preorder: { depositPercent: 30 }, campaigns: [spend, { id: "z", kind: "bad" }] });
    expect(n.preorder).toMatchObject({ depositPercent: 30, capSlots: 50 }); expect(n.campaigns).toHaveLength(1);
    expect(normalizePromotions(null).preorder).toEqual(DEFAULT_PREORDER);
  });
});
describe("pre-order deposit", () => {
  it("rounds the deposit up and keeps the balance", () => { const s = preorderSplit(1001, { ...DEFAULT_PREORDER, depositPercent: 50 }); expect(s.depositCents).toBe(501); expect(s.balanceCents).toBe(500); });
  it("customers pay the deposit now, others the full total", () => { expect(payNowCents({ totalCents: 1000 })).toBe(1000); expect(payNowCents({ totalCents: 1000, preorder: { depositCents: 300 } })).toBe(300); });
});
describe("roles", () => {
  it("limits what each role can do", () => {
    expect(can("owner", "staff")).toBe(true); expect(can("admin", "staff")).toBe(false); expect(can("admin", "orders")).toBe(true);
    expect(can("editor", "products")).toBe(true); expect(can("editor", "orders")).toBe(false); expect(can(null, "products")).toBe(false);
  });
  it("makes initials", () => { expect(initialsOf("Yihor Theng")).toBe("YT"); expect(initialsOf("", "sokha@x.com")).toBe("S"); });
});
describe("product fields", () => {
  it("maps Khmer name and keeps only known labels", () => {
    const p = toProduct({ id: "1", slug: "s", name: "Bunny", sku: "K", price: "3", sale_price: null, stock: 2, created_at: "", category: "C", description: null, images: null, active: true, name_km: "ទន្សាយ", labels: ["preorder", "bogus"] });
    expect(p.labels).toEqual(["preorder"]); expect(isPreorder(p)).toBe(true); expect(nameFor(p, "km")).toBe("ទន្សាយ"); expect(nameFor(p, "en")).toBe("Bunny");
  });
});

import { checkFestival, productPromo, inSpecialOffer, festivalPhase, type Festival } from "../shared/promotions";
describe("festival special offers", () => {
  const v = checkFestival({ name: "Khmer New Year", percent: 20, productIds: ["a", "b"], startDate: "2026-01-01", endDate: "2099-01-01" });
  const f: Festival = { ...(v as { ok: true; value: Omit<Festival, "id" | "active" | "createdAt"> }).value, id: "x", active: true, createdAt: "" };
  it("validates the form", () => { expect(v.ok).toBe(true); expect(checkFestival({ name: "x" }).ok).toBe(false); expect(checkFestival({ name: "Fest", startDate: "2026-01-01" }).ok).toBe(false); });
  it("is live only inside its dates and while switched on", () => { expect(festivalPhase(f)).toBe("live"); expect(festivalPhase({ ...f, active: false })).toBe("paused"); expect(festivalPhase({ ...f, endDate: "2026-01-02" })).toBe("ended"); });
  it("discounts only the picked products", () => { expect(productPromo({ id: "a", price: 10 }, [], [f]).finalCents).toBe(800); expect(productPromo({ id: "z", price: 10 }, [], [f]).finalCents).toBe(1000); });
  it("lists picked products under Special Offer", () => { expect(inSpecialOffer({ id: "a", price: 5 }, [], [f])).toBe(true); expect(inSpecialOffer({ id: "q", price: 5 }, [], [f])).toBe(false); });
  it("applies at checkout", () => expect(autoDiscounts([{ category: "", lineCents: 2000, productId: "a" }, { category: "", lineCents: 1000, productId: "z" }], [], [f])[0].cents).toBe(400));
});

import { bogoGifts, freeShippingRule, campaignLive, campaignDetail } from "../shared/promotions";
describe("promotion rules: dates, BOGO, free shipping, product targets", () => {
  const base = { id: "r", name: "Rule", minSpendCents: 0, amountCents: 0, percent: 0, category: "", active: true, createdAt: "" };
  it("respects start / end dates", () => { expect(campaignLive({ active: true, startDate: "2026-01-01", endDate: "2099-01-01" })).toBe(true); expect(campaignLive({ active: true, startDate: "2020-01-01", endDate: "2020-02-01" })).toBe(false); expect(campaignLive({ active: false })).toBe(false); });
  it("validates Buy X Get Y", () => {
    expect(checkCampaign({ name: "Bundle", kind: "bogo", buyQty: 2, buyType: "category", buyTarget: "Plush", getQty: 1, bonusProductId: "sticker" }).ok).toBe(true);
    expect(checkCampaign({ name: "Bundle", kind: "bogo", buyQty: 0, buyTarget: "Plush", getQty: 1, bonusProductId: "s" }).ok).toBe(false);
    expect(checkCampaign({ name: "Bundle", kind: "bogo", buyQty: 2, buyTarget: "Plush", getQty: 1 }).ok).toBe(false);
  });
  it("gives whole multiples of free bonus items", () => {
    const bogo: Campaign = { ...base, kind: "bogo", buyQty: 2, buyType: "category", buyTarget: "Plush", getQty: 1, bonusProductId: "sticker" };
    expect(bogoGifts([{ productId: "a", category: "plush", qty: 5 }], [bogo])).toEqual([{ campaignId: "r", name: "Rule", productId: "sticker", qty: 2 }]);
    expect(bogoGifts([{ productId: "a", category: "plush", qty: 1 }], [bogo])).toEqual([]);
    expect(bogoGifts([{ productId: "a", category: "Other", qty: 9 }], [bogo])).toEqual([]);
  });
  it("waives delivery by spend, item count and area", () => {
    const fs: Campaign = { ...base, kind: "free_shipping", minSpendCents: 2000 }; const q: Campaign = { ...base, kind: "free_shipping", minQty: 3 }; const pp: Campaign = { ...base, kind: "free_shipping", area: "PHNOM_PENH" };
    expect(freeShippingRule({ subtotalCents: 2500, qty: 1, area: "PROVINCE" }, [fs])).not.toBeNull(); expect(freeShippingRule({ subtotalCents: 1500, qty: 1, area: "PROVINCE" }, [fs])).toBeNull();
    expect(freeShippingRule({ subtotalCents: 100, qty: 3, area: "PROVINCE" }, [q])).not.toBeNull(); expect(freeShippingRule({ subtotalCents: 100, qty: 2, area: "PROVINCE" }, [q])).toBeNull();
    expect(freeShippingRule({ subtotalCents: 100, qty: 1, area: "PROVINCE" }, [pp])).toBeNull(); expect(freeShippingRule({ subtotalCents: 100, qty: 1, area: "PHNOM_PENH" }, [pp])).not.toBeNull();
  });
  it("discounts only picked products", () => {
    const pr: Campaign = { ...base, kind: "product_percent", percent: 20, productIds: ["a"] };
    expect(autoDiscounts([{ category: "", lineCents: 1000, productId: "a" }, { category: "", lineCents: 1000, productId: "b" }], [pr])[0].cents).toBe(200);
    expect(productPromo({ id: "a", price: 10 }, [pr]).finalCents).toBe(800); expect(campaignDetail({ ...pr })).toContain("1 selected product");
  });
});

describe("fixed-amount and free-gift rewards", () => {
  const catAmt: Campaign = { id: "ca", name: "$3 off plush", kind: "category_amount", minSpendCents: 0, amountCents: 300, percent: 0, category: "Plushies", active: true, createdAt: "" };
  const prodAmt: Campaign = { ...catAmt, id: "pa", kind: "product_amount", category: "", productIds: ["x"] };
  const gift: Campaign = { ...catAmt, id: "g", kind: "spend_gift", amountCents: 0, minSpendCents: 5000, bonusProductId: "sticker", getQty: 2 };
  it("validates the new kinds", () => {
    expect(checkCampaign({ name: "Cat", kind: "category_amount", amount: 3, category: "Plushies" }).ok).toBe(true);
    expect(checkCampaign({ name: "Cat", kind: "category_amount", amount: 0, category: "Plushies" }).ok).toBe(false);
    expect(checkCampaign({ name: "Prod", kind: "product_amount", amount: 2, productIds: [] }).ok).toBe(false);
    expect(checkCampaign({ name: "Prod", kind: "product_amount", amount: 2, productIds: ["x"] }).ok).toBe(true);
    expect(checkCampaign({ name: "Gift", kind: "spend_gift", minSpend: 50, bonusProductId: "s" }).ok).toBe(true);
    expect(checkCampaign({ name: "Gift", kind: "spend_gift", minSpend: 0, bonusProductId: "s" }).ok).toBe(false);
    expect(checkCampaign({ name: "Gift", kind: "spend_gift", minSpend: 50 }).ok).toBe(false);
  });
  it("takes a fixed amount off each unit, never more than the lines", () => {
    expect(autoTotal(autoDiscounts([{ category: "plushies", lineCents: 4000, qty: 2 }], [catAmt]))).toBe(600);
    expect(autoTotal(autoDiscounts([{ category: "plushies", lineCents: 200, qty: 1 }], [catAmt]))).toBe(200);
    expect(autoTotal(autoDiscounts([{ category: "x", lineCents: 900, productId: "x", qty: 3 }], [prodAmt]))).toBe(900);
    expect(productPromo({ id: "x", category: "z", price: 10 }, [prodAmt]).finalCents).toBe(700);
  });
  it("gives the free gift only at the minimum spend", () => {
    const l = (c: number) => [{ productId: "a", category: "c", qty: 1, lineCents: c }];
    expect(bogoGifts(l(4999), [gift])).toEqual([]);
    expect(bogoGifts(l(5000), [gift])).toEqual([{ campaignId: "g", name: "$3 off plush", productId: "sticker", qty: 2 }]);
  });
});

describe("offer card picture", () => {
  it("accepts our own uploads and https links, rejects anything else", () => {
    const ok = (image: unknown) => checkCampaign({ name: "Free ship", kind: "free_shipping", image }).ok;
    expect(ok("")).toBe(true); expect(ok(undefined)).toBe(true);
    expect(ok("/api/img/offer-ab12cd34.webp")).toBe(true); expect(ok("https://x.supabase.co/storage/v1/object/public/p/offer-1.webp")).toBe(true);
    expect(ok("javascript:alert(1)")).toBe(false); expect(ok("http://insecure.test/a.png")).toBe(false); expect(ok("/api/img/../secret.png")).toBe(false);
  });
  it("keeps the picture through save / load and on festivals", () => {
    const n = normalizePromotions({ campaigns: [{ id: "a", name: "Free ship", kind: "free_shipping", active: true, image: "/api/img/offer-ab12cd34.webp" }], festivals: [{ id: "f", name: "Water Festival", startDate: "", endDate: "", percent: 30, productIds: ["p"], image: "/api/img/offer-zz99.webp" }] });
    expect(n.campaigns[0]?.image).toBe("/api/img/offer-ab12cd34.webp"); expect(n.festivals[0]?.image).toBe("/api/img/offer-zz99.webp");
    expect(normalizePromotions({ festivals: [{ id: "f", name: "Bad", image: "javascript:x" }] }).festivals).toEqual([]);
  });
});
