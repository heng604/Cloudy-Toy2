import { describe, it, expect } from "vitest";
import { parseOptions, serializeOptions, cleanOptionGroups, isValidOption, optionText, OPTION_LIMITS } from "../shared/products";

const chars = [{ name: "Character", values: ["Xavier", "Zayne", "Rafayel", "Sylus"] }];
const two = [...chars, { name: "Size", values: ["S", "M"] }];

describe("product options", () => {
  it("reads the plain text the shop already has (one group)", () => {
    expect(parseOptions("Character: Xavier, Zayne, Rafayel, Sylus")).toEqual(chars);
  });
  it("reads old plain text with two groups", () => {
    expect(parseOptions("Size: 11cm, Color: Pastel Pink")).toEqual([{ name: "Size", values: ["11cm"] }, { name: "Color", values: ["Pastel Pink"] }]);
  });
  it("reads plain text without any group name", () => { expect(parseOptions("Red, Blue")).toEqual([{ name: "Option", values: ["Red", "Blue"] }]); });
  it("empty / missing = no options", () => { expect(parseOptions("")).toEqual([]); expect(parseOptions(undefined)).toEqual([]); expect(parseOptions("[]")).toEqual([]); });
  it("round-trips through the JSON the admin form saves", () => { expect(parseOptions(serializeOptions(two))).toEqual(two); });
  it("cleans admin input: trims, drops blanks and duplicates, merges same-name groups, applies limits", () => {
    expect(cleanOptionGroups([{ name: "  Size ", values: ["S", " S", "", "M"] }, { name: "", values: ["x"] }, { name: "size", values: ["L"] }, { name: "Empty", values: [] }])).toEqual([{ name: "Size", values: ["S", "M", "L"] }]);
    expect(cleanOptionGroups(Array.from({ length: 10 }, (_, i) => ({ name: `G${i}`, values: ["a"] }))).length).toBe(OPTION_LIMITS.groups);
    expect(serializeOptions([])).toBe(""); expect(serializeOptions("garbage")).toBe("");
  });
  it("survives invalid JSON", () => { expect(parseOptions("[oops")).toEqual([{ name: "Option", values: ["[oops"] }]); });
  it("builds the text shown in the cart / order", () => { expect(optionText(two, { Size: "M", Character: "Zayne" })).toBe("Character: Zayne · Size: M"); });

  describe("server check of the option a customer sends", () => {
    it("accepts exactly one choice per group", () => {
      expect(isValidOption(chars, "Character: Sylus")).toBe(true);
      expect(isValidOption(two, "Character: Xavier · Size: M")).toBe(true);
    });
    it("rejects a missing, unknown, partial or extra option", () => {
      expect(isValidOption(chars, "")).toBe(false); expect(isValidOption(chars, undefined)).toBe(false);
      expect(isValidOption(chars, "Character: Hacker")).toBe(false);
      expect(isValidOption(two, "Character: Xavier")).toBe(false);
      expect(isValidOption(two, "Size: M · Character: Xavier")).toBe(false);
      expect(isValidOption(chars, "Character: Xavier · Size: M")).toBe(false);
    });
    it("a product without options must not receive one", () => { expect(isValidOption([], "")).toBe(true); expect(isValidOption([], "Character: Xavier")).toBe(false); });
    it("handles choices that share a start", () => { const g = [{ name: "Pack", values: ["A", "A · B"] }, { name: "Size", values: ["S"] }]; expect(isValidOption(g, "Pack: A · B · Size: S")).toBe(true); expect(isValidOption(g, "Pack: A · Size: S")).toBe(true); expect(isValidOption(g, "Pack: A · B")).toBe(false); });
  });
});
