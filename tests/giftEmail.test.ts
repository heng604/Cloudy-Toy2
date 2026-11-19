import { describe, it, expect, vi, afterEach } from "vitest";
import { sendGiftAdminEmail, sendGiftCustomerEmail } from "../server/lib/giftEmail";
const info = { redemption: { id: "abc123", email: "a@b.co", customerName: "Dara", giftId: "g1", giftName: "Plush <Cloud>", giftImage: "", points: 5, status: "PENDING" as const, createdAt: "2026-11-19T03:00:00Z", claimedAt: null }, email: "a@b.co", name: "Dara Sok", phone: "012345678", address: "Phnom Penh", facebook: "", telegram: "@dara", balanceAfter: 2, tierName: "Silver" };
afterEach(() => { vi.unstubAllGlobals(); delete process.env.RESEND_API_KEY; delete process.env.ADMIN_NOTIFICATION_EMAIL; });
describe("gift receipts", () => {
  it("skips quietly without an e-mail key", async () => { expect((await sendGiftAdminEmail(info)).status).toBe("SKIPPED"); });
  it("sends the admin a receipt with the customer's contact details (html-escaped) and the customer a copy", async () => {
    process.env.RESEND_API_KEY = "k"; process.env.ADMIN_NOTIFICATION_EMAIL = "admin@shop.com"; const calls: { to: string[]; subject: string; html: string }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init: { body: string }) => { calls.push(JSON.parse(init.body)); return { ok: true, status: 200, text: async () => "" }; }));
    expect((await sendGiftAdminEmail(info)).status).toBe("SENT"); expect((await sendGiftCustomerEmail(info)).status).toBe("SENT");
    expect(calls[0].to).toEqual(["admin@shop.com"]); expect(calls[0].subject).toContain("GIFT-abc123"); expect(calls[0].html).toContain("Plush &lt;Cloud&gt;"); expect(calls[0].html).toContain("012345678"); expect(calls[0].html).toContain("2 pts");
    expect(calls[1].to).toEqual(["a@b.co"]); expect(calls[1].html).toContain("Dara");
  });
});
