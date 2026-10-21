import { describe, it, expect } from "vitest";
import { adminHtml, adminSubject, sendAdminEmail, fromAddress } from "../server/lib/email";
import type { StoredOrder } from "../shared/types";
const o: StoredOrder = { orderNumber: "CT-1", createdAt: "2026-10-18", area: "PHNOM_PENH", method: "COD", customer: { name: "<b>Sok</b>", email: "a@b.com", phone: "012", address: "Phnom Penh" },
  items: [{ productId: "1", sku: "CT-TOY-001", name: "Bear", qty: 2, unitCents: 1500, lineCents: 3000 }], subtotalCents: 3000, discountCents: 0, shippingCents: 150, totalCents: 3150, currency: "USD", paymentStatus: "PENDING", paymentReference: "PAY-CT-1", email: { status: "NONE", attempts: 0 } };
describe("admin email", () => {
  it("COD subject and note say pay with delivery", () => { expect(adminSubject(o)).toContain("PAY WITH DELIVERY"); expect(adminHtml(o)).toContain("collect <b>$31.50</b>"); });
  it("QR order is flagged NOT VERIFIED", () => { const q = { ...o, method: "QR_IMAGE" as const }; expect(adminSubject(q)).toContain("verify manually"); expect(adminHtml(q)).toContain("NOT VERIFIED"); });
  it("escapes customer HTML", () => { const h = adminHtml(o); expect(h).not.toContain("<b>Sok"); expect(h).toContain("&lt;b&gt;"); });
  it("never claims SENT without credentials", async () => { delete process.env.RESEND_API_KEY; expect((await sendAdminEmail(o)).status).toBe("SKIPPED"); });
  it("ignores gmail sender, keeps verified-domain sender", () => {
    expect(fromAddress("toyscloudy@gmail.com")).toContain("onboarding@resend.dev"); expect(fromAddress("")).toContain("onboarding@resend.dev"); expect(fromAddress(undefined)).toContain("onboarding@resend.dev");
    expect(fromAddress("Cloudy-Toy <orders@cloudytoy.com>")).toBe("Cloudy-Toy <orders@cloudytoy.com>");
  });
});
import { claimSubject, claimHtml, sendPaidClaimEmail, adminInbox } from "../server/lib/email";
describe("customer paid-claim email", () => {
  it("is clearly NOT VERIFIED and names order, total", () => { expect(claimSubject(o)).toContain("please verify"); const h = claimHtml(o); expect(h).toContain("NOT VERIFIED"); expect(h).toContain("$31.50"); expect(h).toContain("CT-1"); });
  it("escapes customer HTML", () => expect(claimHtml(o)).not.toContain("<b>Sok"));
  it("defaults to the admin account inbox", () => { delete process.env.ADMIN_NOTIFICATION_EMAIL; expect(adminInbox()).toBe("toyscloudy@gmail.com"); });
  it("never claims SENT without a Resend key", async () => { delete process.env.RESEND_API_KEY; expect((await sendPaidClaimEmail(o)).status).toBe("SKIPPED"); });
});
