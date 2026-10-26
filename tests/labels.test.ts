import { describe, it, expect } from "vitest";
import { normalizeLabels } from "../shared/products";
describe("New Arrival is automatic", () => {
  it("no type chosen = New Arrival", () => { expect(normalizeLabels([])).toEqual(["new_arrival"]); expect(normalizeLabels(undefined)).toEqual(["new_arrival"]); });
  it("another type replaces New Arrival", () => { expect(normalizeLabels(["new_arrival", "preorder"])).toEqual(["preorder"]); expect(normalizeLabels(["restock", "best_seller"])).toEqual(["restock", "best_seller"]); });
});
