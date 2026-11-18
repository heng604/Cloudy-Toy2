import { describe, expect, it } from "vitest";
import { checkGift } from "../shared/gifts";
import { fullPriceCents } from "../shared/promotions";
describe("gifts", () => {
  it("accepts a normal gift and trims it", () => { const r = checkGift({ name: " Tote Bag ", description: "x", points: "20", wasPoints: "30", stock: "5", image: "/api/img/a.webp" }); expect(r.ok).toBe(true); if (r.ok) expect([r.value.name, r.value.points, r.value.wasPoints, r.value.stock, r.value.active]).toEqual(["Tote Bag", 20, 30, 5, true]); });
  it("rejects bad input", () => {
    expect(checkGift({ name: "x", points: 5, stock: 1 }).ok).toBe(false); expect(checkGift({ name: "Bag", points: 0, stock: 1 }).ok).toBe(false); expect(checkGift({ name: "Bag", points: 2.5, stock: 1 }).ok).toBe(false);
    expect(checkGift({ name: "Bag", points: 5, wasPoints: 5, stock: 1 }).ok).toBe(false); expect(checkGift({ name: "Bag", points: 5, stock: -1 }).ok).toBe(false); expect(checkGift({ name: "Bag", points: 5, stock: 1, image: "javascript:x" }).ok).toBe(false);
  });
});
describe("full-price part of a cart", () => {
  it("leaves out pre-order and out-of-stock items", () => {
    const l = (p: object, c: number) => ({ p: { price: 10, ...p }, lineCents: c });
    expect(fullPriceCents([l({ stock: 5 }, 1000), l({ stock: 5, preorder: true }, 1000), l({ stock: 0 }, 1000), l({ labels: ["preorder"] }, 1000), l({ salePrice: 8 }, 800)], [], [])).toBe(1000);
  });
});
