import { describe, it, expect } from "vitest";
import { ProfileInput } from "../shared/profile";
describe("profile input", () => {
  it("accepts name and phone", () => expect(ProfileInput.safeParse({ display_name: " Sok ", phone: "+855 12 345 678" }).success).toBe(true));
  it("rejects letters in phone and long names", () => { expect(ProfileInput.safeParse({ display_name: "a", phone: "abc" }).success).toBe(false); expect(ProfileInput.safeParse({ display_name: "x".repeat(81), phone: "" }).success).toBe(false); });
  it("drops privileged fields like role", () => expect(Object.keys(ProfileInput.parse({ display_name: "a", phone: "1", role: "admin" } as never))).toEqual(["display_name", "phone", "address", "facebook", "telegram"]));
  it("accepts contact info and trims it", () => { const p = ProfileInput.parse({ display_name: "a", phone: "1", address: " House 12 ", facebook: " Sok Dara ", telegram: "@sokdara" }); expect([p.address, p.facebook, p.telegram]).toEqual(["House 12", "Sok Dara", "@sokdara"]); });
  it("rejects a too long address", () => expect(ProfileInput.safeParse({ display_name: "a", phone: "1", address: "x".repeat(301) }).success).toBe(false));
});
