import { describe, expect, it } from "vitest";
import { DEFAULT_TIERS, checkTier, memberBenefits, monthUsage, shopMonth, memberSpendOf, nextTier, normalizeTiers, tierFor } from "../shared/membership";
import { DEFAULT_PROMOTIONS, normalizePromotions } from "../shared/promotions";

describe("membership levels", () => {
  it("defaults: Bronze $70, Platinum $120, Gold $300", () => {
    expect(DEFAULT_TIERS.map((t) => [t.name, t.minSpendCents])).toEqual([["Bronze", 7000], ["Platinum", 12000], ["Gold", 30000]]);
  });
  it("picks the highest level reached, and the next one", () => {
    expect(tierFor(6999, DEFAULT_TIERS)).toBeNull();
    expect(tierFor(7000, DEFAULT_TIERS)?.name).toBe("Bronze");
    expect(tierFor(11999, DEFAULT_TIERS)?.name).toBe("Bronze");
    expect(tierFor(12000, DEFAULT_TIERS)?.name).toBe("Platinum");
    expect(tierFor(30000, DEFAULT_TIERS)?.name).toBe("Gold");
    expect(nextTier(0, DEFAULT_TIERS)?.name).toBe("Bronze");
    expect(nextTier(12000, DEFAULT_TIERS)?.name).toBe("Gold");
    expect(nextTier(99999, DEFAULT_TIERS)).toBeNull();
  });
  it("paused levels are ignored", () => {
    const t = DEFAULT_TIERS.map((x) => (x.id === "platinum" ? { ...x, active: false } : x));
    expect(tierFor(15000, t)?.name).toBe("Bronze");
  });
  it("spend counts only PAID orders, without delivery", () => {
    expect(memberSpendOf([{ paymentStatus: "PAID", totalCents: 5000, shippingCents: 150 }, { paymentStatus: "PENDING", totalCents: 9000, shippingCents: 0 }, { paymentStatus: "REFUNDED", totalCents: 4000, shippingCents: 0 }])).toBe(4850);
  });
  it("percent, amount and free-shipping specials; never more than what is left", () => {
    const tier = checkTier({ name: "Gold", minSpend: 300, perks: [{ kind: "percent", title: "10% off", percent: 10 }, { kind: "amount", title: "$2 off over $50", amount: 2, minSpend: 50 }, { kind: "free_shipping", title: "Free delivery" }, { kind: "custom", title: "Birthday gift" }] });
    expect(tier.ok).toBe(true); if (!tier.ok) return;
    const a = memberBenefits(tier.value, { subtotalCents: 10000, leftCents: 10000 });
    expect(a.discounts.map((d) => d.cents)).toEqual([1000, 200]); expect(a.freeShipping).toBe(true);
    expect(memberBenefits(tier.value, { subtotalCents: 4000, leftCents: 4000 }).discounts.map((d) => d.cents)).toEqual([400]);
    expect(memberBenefits(tier.value, { subtotalCents: 10000, leftCents: 500 }).discounts.reduce((s, d) => s + d.cents, 0)).toBe(500);
    expect(memberBenefits(null, { subtotalCents: 10000, leftCents: 10000 })).toEqual({ discounts: [], freeShipping: false, perks: [], shipPerks: [] });
  });
  it("rejects bad input", () => {
    expect(checkTier({ name: "x", minSpend: 10 }).ok).toBe(false);
    expect(checkTier({ name: "Silver", minSpend: 0 }).ok).toBe(false);
    expect(checkTier({ name: "Silver", minSpend: 10, perks: [{ kind: "percent", title: "Too big", percent: 95 }] }).ok).toBe(false);
    expect(checkTier({ name: "Silver", minSpend: 10, perks: [{ kind: "amount", title: "Big", amount: 20, minSpend: 10 }] }).ok).toBe(false);
  });
  it("stored data: never saved = defaults, saved empty = no levels, survives normalize", () => {
    expect(normalizePromotions({}).membership.length).toBe(3);
    expect(normalizePromotions({ membership: [] }).membership).toEqual([]);
    expect(DEFAULT_PROMOTIONS.membership.length).toBe(3);
    const saved = normalizeTiers([{ id: "g", name: "Gold", emoji: "🥇", minSpendCents: 30000, active: true, perks: [{ id: "p1", kind: "percent", title: "5% off", percent: 5, amountCents: 0, minSpendCents: 0, active: true }] }]);
    expect(saved[0].perks[0].percent).toBe(5); expect(normalizeTiers(saved)).toEqual(saved);
  });
});

describe("monthly limits", () => {
  const tier = checkTier({ id: "g", name: "Gold", minSpend: 300, image: "/api/img/x.webp", perks: [{ id: "p1", kind: "percent", title: "10% off", percent: 10, monthlyLimit: 2 }, { id: "p2", kind: "free_shipping", title: "Free delivery", monthlyLimit: 1 }] });
  if (!tier.ok) throw new Error(tier.error);
  it("keeps the picture and the limit", () => { expect(tier.value.image).toBe("/api/img/x.webp"); expect(tier.value.perks.map((p) => p.monthlyLimit)).toEqual([2, 1]); });
  it("rejects a bad limit or picture", () => {
    expect(checkTier({ name: "Silver", minSpend: 10, perks: [{ kind: "percent", title: "x%", percent: 5, monthlyLimit: -1 }] }).ok).toBe(false);
    expect(checkTier({ name: "Silver", minSpend: 10, image: "javascript:alert(1)" }).ok).toBe(false);
  });
  it("skips a special that reached its monthly limit", () => {
    const cart = { subtotalCents: 10000, leftCents: 10000 };
    expect(memberBenefits(tier.value, cart, { p1: 1 }).discounts).toHaveLength(1);
    expect(memberBenefits(tier.value, cart, { p1: 2 }).discounts).toHaveLength(0);
    expect(memberBenefits(tier.value, cart, { p2: 1 }).freeShipping).toBe(false);
    expect(memberBenefits(tier.value, cart, {}).perks).toEqual(["p1"]);
  });
  it("counts this month's uses, ignoring other months and failed orders", () => {
    const now = new Date().toISOString(), old = new Date(Date.now() - 70 * 86400000).toISOString();
    const u = monthUsage([{ createdAt: now, paymentStatus: "PAID", memberPerks: ["p1"] }, { createdAt: now, paymentStatus: "PENDING", memberPerks: ["p1", "p2"] }, { createdAt: now, paymentStatus: "FAILED", memberPerks: ["p1"] }, { createdAt: old, paymentStatus: "PAID", memberPerks: ["p1"] }], shopMonth());
    expect(u).toEqual({ p1: 2, p2: 1 });
  });
});
