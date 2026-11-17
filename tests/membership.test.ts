import { describe, expect, it } from "vitest";
import { DEFAULT_TIERS, checkTier, memberBenefits, monthUsage, shopMonth, memberSpendOf, normalizeTiers, tierByOrders, levelAfter } from "../shared/membership";
import { DEFAULT_PROMOTIONS, normalizePromotions } from "../shared/promotions";

describe("membership levels", () => {
  it("defaults: Bronze at $30 paid in total, then ONE order of $200 / $300 / $400", () => {
    expect(DEFAULT_TIERS.map((t) => [t.name, t.singleOrderCents])).toEqual([["Bronze", 0], ["Silver", 20000], ["Gold", 30000], ["Platinum", 40000]]);
    expect(DEFAULT_TIERS[0].minSpendCents).toBe(3000);
  });
  const ord = (n: number, cents: number, shipping = 0, status = "PAID") => ({ paymentStatus: status, totalCents: cents + shipping, shippingCents: shipping, createdAt: `2026-01-${String(n).padStart(2, "0")}T00:00:00Z` });
  it("Bronze comes from the total paid; Silver needs ONE order of $200 after that", () => {
    expect(tierByOrders([ord(1, 2999)], DEFAULT_TIERS)).toBeNull();
    expect(tierByOrders([ord(1, 1500), ord(2, 1500)], DEFAULT_TIERS)?.name).toBe("Bronze");
    expect(tierByOrders([ord(1, 3000), ord(2, 10000), ord(3, 10000)], DEFAULT_TIERS)?.name).toBe("Bronze"); // $200 paid in two orders is not enough
    expect(tierByOrders([ord(1, 3000), ord(2, 19999)], DEFAULT_TIERS)?.name).toBe("Bronze");
    expect(tierByOrders([ord(1, 3000), ord(2, 20000)], DEFAULT_TIERS)?.name).toBe("Silver");
  });
  it("Gold needs one $300 order after Silver; Platinum one $400 order after Gold", () => {
    expect(tierByOrders([ord(1, 3000), ord(2, 20000), ord(3, 29999)], DEFAULT_TIERS)?.name).toBe("Silver");
    expect(tierByOrders([ord(1, 3000), ord(2, 20000), ord(3, 30000)], DEFAULT_TIERS)?.name).toBe("Gold");
    expect(tierByOrders([ord(1, 3000), ord(2, 20000), ord(3, 30000), ord(4, 39999)], DEFAULT_TIERS)?.name).toBe("Gold");
    expect(tierByOrders([ord(1, 3000), ord(2, 20000), ord(3, 30000), ord(4, 40000)], DEFAULT_TIERS)?.name).toBe("Platinum");
  });
  it("the order that makes them a member does not upgrade them; one big order after Bronze can climb several levels", () => {
    expect(tierByOrders([ord(1, 50000)], DEFAULT_TIERS)?.name).toBe("Bronze");
    expect(tierByOrders([ord(1, 3000), ord(2, 40000)], DEFAULT_TIERS)?.name).toBe("Platinum");
  });
  it("delivery and unpaid / refunded orders do not count; order of arrival does not matter", () => {
    expect(tierByOrders([ord(1, 3000), ord(2, 19000, 1500)], DEFAULT_TIERS)?.name).toBe("Bronze");
    expect(tierByOrders([ord(1, 3000), ord(2, 20000, 0, "PENDING"), ord(3, 20000, 0, "REFUNDED")], DEFAULT_TIERS)?.name).toBe("Bronze");
    expect(tierByOrders([ord(2, 20000), ord(1, 3000)], DEFAULT_TIERS)?.name).toBe("Silver");
  });
  it("levelAfter: the first level for a non-member, then the ladder, null at the top", () => {
    expect(levelAfter(null, DEFAULT_TIERS)?.name).toBe("Bronze"); expect(levelAfter(DEFAULT_TIERS[1], DEFAULT_TIERS)?.name).toBe("Gold"); expect(levelAfter(DEFAULT_TIERS[3], DEFAULT_TIERS)).toBeNull();
  });
  it("levels saved with the old point rules get the $200 / $300 one-order amounts", () => {
    const old = normalizeTiers([{ id: "b", name: "Bronze", emoji: "x", minSpendCents: 3000, active: true, perks: [] }, { id: "s", name: "Silver", emoji: "y", minSpendCents: 7000, pointsMore: 4, active: true, perks: [] }]);
    expect(old.map((t) => t.singleOrderCents)).toEqual([0, 20000]);
  });
  it("paused levels are ignored", () => {
    const t = DEFAULT_TIERS.map((x) => (x.id === "gold" ? { ...x, active: false } : x));
    expect(tierByOrders([ord(1, 3000), ord(2, 20000), ord(3, 30000)], t)?.name).toBe("Silver");
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
    expect(checkTier({ name: "Silver", minSpend: 0 }).ok).toBe(false); expect(checkTier({ name: "Silver", singleOrder: -5 }).ok).toBe(false); expect(checkTier({ name: "Silver", singleOrder: 200 }).ok).toBe(true);
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

describe("custom special with detail and picture", () => {
  it("keeps detail + picture on a custom special and drops them on other kinds", () => {
    const t = checkTier({ name: "Gold", minSpend: 30, perks: [{ kind: "custom", title: "Free toy", detail: " Pick 1 toy ", image: "/img/toy.png" }, { kind: "percent", percent: 5, detail: "x", image: "/img/a.png" }] });
    expect(t.ok).toBe(true); if (!t.ok) return;
    expect(t.value.perks[0].detail).toBe("Pick 1 toy"); expect(t.value.perks[0].image).toBe("/img/toy.png");
    expect(t.value.perks[1].detail).toBe(""); expect(t.value.perks[1].image).toBe("");
  });
  it("rejects a bad picture address or a too-long detail", () => {
    expect(checkTier({ name: "Gold", minSpend: 30, perks: [{ kind: "custom", title: "Gift", image: "javascript:alert(1)" }] }).ok).toBe(false);
    expect(checkTier({ name: "Gold", minSpend: 30, perks: [{ kind: "custom", title: "Gift", detail: "a".repeat(301) }] }).ok).toBe(false);
  });
});
