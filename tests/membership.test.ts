import { describe, expect, it } from "vitest";
import { DEFAULT_TIERS, layoutTiers, pointsOf, pointsFor, checkTier, memberBenefits, monthUsage, shopMonth, memberSpendOf, nextTier, normalizeTiers, tierFor } from "../shared/membership";
import { DEFAULT_PROMOTIONS, normalizePromotions } from "../shared/promotions";

describe("membership levels", () => {
  it("defaults: Bronze at $30, then Silver +10 points, Gold +20 more, Platinum +30 more (1 point = $10 after Bronze)", () => {
    expect(DEFAULT_TIERS.map((t) => [t.name, t.pointsMore, t.minSpendCents])).toEqual([["Bronze", 0, 3000], ["Silver", 10, 13000], ["Gold", 20, 33000], ["Platinum", 30, 63000]]);
    expect(DEFAULT_TIERS.map((t) => pointsFor(t, DEFAULT_TIERS))).toEqual([0, 10, 30, 60]);
  });
  it("points: nothing before Bronze, the first $30 gives none, then 1 point per $10", () => {
    expect(pointsOf(2999, DEFAULT_TIERS)).toBe(0); expect(pointsOf(3000, DEFAULT_TIERS)).toBe(0); expect(pointsOf(3999, DEFAULT_TIERS)).toBe(0);
    expect(pointsOf(4000, DEFAULT_TIERS)).toBe(1); expect(pointsOf(13000, DEFAULT_TIERS)).toBe(10); expect(pointsOf(63000, DEFAULT_TIERS)).toBe(60);
    expect(pointsOf(5000, [])).toBe(0);
  });
  it("picks the highest level reached, and the next one", () => {
    expect(tierFor(2999, DEFAULT_TIERS)).toBeNull();
    expect(tierFor(3000, DEFAULT_TIERS)?.name).toBe("Bronze");
    expect(tierFor(12999, DEFAULT_TIERS)?.name).toBe("Bronze");
    expect(tierFor(13000, DEFAULT_TIERS)?.name).toBe("Silver");
    expect(tierFor(33000, DEFAULT_TIERS)?.name).toBe("Gold");
    expect(tierFor(63000, DEFAULT_TIERS)?.name).toBe("Platinum");
    expect(nextTier(0, DEFAULT_TIERS)?.name).toBe("Bronze");
    expect(nextTier(33000, DEFAULT_TIERS)?.name).toBe("Platinum");
    expect(nextTier(99999, DEFAULT_TIERS)).toBeNull();
  });
  it("changing the price of a point moves every level", () => {
    expect(layoutTiers(DEFAULT_TIERS, 500).map((t) => t.minSpendCents)).toEqual([3000, 8000, 18000, 33000]);
  });
  it("levels saved before points existed keep their spend", () => {
    const old = normalizeTiers([{ id: "b", name: "Bronze", emoji: "x", minSpendCents: 3000, active: true, perks: [] }, { id: "s", name: "Silver", emoji: "y", minSpendCents: 7000, active: true, perks: [] }]);
    expect(old.map((t) => [t.pointsMore, t.minSpendCents])).toEqual([[0, 3000], [4, 7000]]);
  });
  it("paused levels are ignored", () => {
    const t = DEFAULT_TIERS.map((x) => (x.id === "gold" ? { ...x, active: false } : x));
    expect(tierFor(40000, t)?.name).toBe("Silver");
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
    expect(checkTier({ name: "Silver", minSpend: 0 }).ok).toBe(false); expect(checkTier({ name: "Silver", pointsMore: 2.5 }).ok).toBe(false); expect(checkTier({ name: "Silver", pointsMore: 10 }).ok).toBe(true);
    expect(checkTier({ name: "Silver", minSpend: 10, perks: [{ kind: "percent", title: "Too big", percent: 95 }] }).ok).toBe(false);
    expect(checkTier({ name: "Silver", minSpend: 10, perks: [{ kind: "amount", title: "Big", amount: 20, minSpend: 10 }] }).ok).toBe(false);
  });
  it("stored data: never saved = defaults, saved empty = no levels, survives normalize", () => {
    expect(normalizePromotions({}).membership.length).toBe(4);
    expect(normalizePromotions({ membership: [] }).membership).toEqual([]);
    expect(DEFAULT_PROMOTIONS.membership.length).toBe(4);
    const saved = normalizeTiers([{ id: "g", name: "Gold", emoji: "🥇", minSpendCents: 30000, active: true, perks: [{ id: "p1", kind: "percent", title: "5% off", percent: 5, amountCents: 0, minSpendCents: 0, active: true }] }]);
    expect(saved[0].perks[0].percent).toBe(5); expect(normalizeTiers(saved)).toEqual(saved);
  });
});

describe("one name per level", () => {
  it("all money / delivery specials of a level share its one name; a custom special keeps its own words", () => {
    const t = checkTier({ name: "Gold", specialName: "Royal Club", minSpend: 30, perks: [{ kind: "percent", title: "ignored", percent: 10 }, { kind: "free_shipping", title: "other" }, { kind: "custom", title: "Birthday gift" }] });
    expect(t.ok).toBe(true); if (!t.ok) return;
    expect(t.value.specialName).toBe("Royal Club");
    expect(t.value.perks.map((p) => p.title)).toEqual(["Royal Club", "Royal Club", "Birthday gift"]);
    expect(memberBenefits(t.value, { subtotalCents: 10000, leftCents: 10000 }).discounts.map((d) => d.name)).toEqual(["Gold member: Royal Club"]);
    expect(checkTier({ name: "Gold", minSpend: 30, perks: [{ kind: "custom" }] }).ok).toBe(false);
  });
  it("no name given = the level name", () => {
    const t = checkTier({ name: "Gold", minSpend: 30, perks: [{ kind: "percent", percent: 5 }, { kind: "amount", amount: 1 }] }); if (!t.ok) throw new Error(t.error);
    expect(t.value.perks.map((p) => p.title)).toEqual(["Gold", "Gold"]);
    expect(memberBenefits(t.value, { subtotalCents: 10000, leftCents: 10000 }).discounts.map((d) => d.name)).toEqual(["Gold member", "Gold member"]);
  });
  it("changing the name renames every special; old data takes the first special's name", () => {
    const t = checkTier({ name: "Gold", specialName: "Royal Club", minSpend: 30, perks: [{ kind: "percent", percent: 5 }] }); if (!t.ok) throw new Error(t.error);
    expect(normalizeTiers([{ ...t.value, specialName: "VIP" }])[0].perks[0].title).toBe("VIP");
    const old = normalizeTiers([{ id: "g", name: "Gold", emoji: "x", minSpendCents: 3000, active: true, perks: [{ id: "a", kind: "percent", title: "Member discount", percent: 5, amountCents: 0, minSpendCents: 0, active: true }, { id: "b", kind: "free_shipping", title: "Free ship", percent: 0, amountCents: 0, minSpendCents: 0, active: true }] }]);
    expect(old[0].specialName).toBe("Member discount"); expect(old[0].perks.map((p) => p.title)).toEqual(["Member discount", "Member discount"]);
  });
});

describe("specials on discounted products", () => {
  const mk = (onPromo: boolean) => { const t = checkTier({ name: "Gold", minSpend: 30, perks: [{ kind: "percent", title: "10% off", percent: 10, onPromo }, { kind: "amount", title: "$5 off", amount: 5, onPromo }] }); if (!t.ok) throw new Error(t.error); return t.value; };
  it("defaults to ON and survives normalize", () => { expect(mk(true).perks.every((p) => p.onPromo)).toBe(true); const d = checkTier({ name: "Gold", minSpend: 30, perks: [{ kind: "percent", title: "10% off", percent: 10 }] }); expect(d.ok && d.value.perks[0].onPromo).toBe(true); expect(normalizeTiers([mk(false)])[0].perks.map((p) => p.onPromo)).toEqual([false, false]); });
  it("ON: stacks on top of the shop's own discounts (capped by what is left)", () => {
    const a = memberBenefits(mk(true), { subtotalCents: 10000, leftCents: 6000, fullPriceCents: 0 });
    expect(a.discounts.map((d) => d.cents)).toEqual([1000, 500]);
  });
  it("OFF: only the full-price part of the cart counts", () => {
    expect(memberBenefits(mk(false), { subtotalCents: 10000, leftCents: 6000, fullPriceCents: 0 }).discounts).toEqual([]);
    expect(memberBenefits(mk(false), { subtotalCents: 10000, leftCents: 6000, fullPriceCents: 4000 }).discounts.map((d) => d.cents)).toEqual([400, 500]);
    expect(memberBenefits(mk(false), { subtotalCents: 10000, leftCents: 10000 }).discounts.map((d) => d.cents)).toEqual([1000, 500]);
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
