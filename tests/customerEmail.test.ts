import { describe, it, expect } from "vitest";
import { customerHtml, customerSubject } from "../server/lib/customerEmail";
import { sendCustomerEmail } from "../server/lib/email";
import { invoiceNo, firstName } from "../shared/invoice";
import type { StoredOrder } from "../shared/types";
const o: StoredOrder = { orderNumber: "CT-261023-AB12C", createdAt: "2026-10-23T05:00:00Z", area: "PHNOM_PENH", method: "COD", customer: { name: "sok <b>dara</b>", email: "a@b.com", phone: "012", address: "St 1" },
  items: [{ productId: "1", sku: "CT-TOY-001", name: "Bear", qty: 2, unitCents: 1500, lineCents: 3000 }], subtotalCents: 3000, discountCents: 300, shippingCents: 150, totalCents: 2850, currency: "USD", discountCode: "HAPPY10", paymentStatus: "PENDING", paymentReference: "PAY-X", email: { status: "NONE", attempts: 0 } };
describe("customer invoice email", () => {
  it("greets the customer by first name and shows totals", () => { const h = customerHtml(o, "placed", "https://shop.test"); expect(h).toContain("Hello, Sok"); expect(h).toContain("$28.50"); expect(h).toContain("HAPPY10"); expect(h).toContain("/img/invoice-logo.jpg"); });
  it("customers get no invoice link; Product header; red discount; ink text", () => { const h = customerHtml(o, "placed", "https://shop.test"); expect(h).not.toContain("/invoice/"); expect(h).not.toContain("/admin/"); expect(h).toContain("PRODUCT"); expect(h).not.toContain(">TOY<"); expect(h).toContain("color:#D62828;font-weight:bold;\">−$3.00"); expect(h).toContain("color:#2F4156\">Hello, Sok"); expect(h).toContain("PAY ON DELIVERY"); });
  it("escapes customer HTML", () => expect(customerHtml(o, "placed", "")).not.toContain("<b>dara"));
  it("works without SITE_URL (no broken image or link)", () => { const h = customerHtml(o, "placed", ""); expect(h).not.toContain("<img"); expect(h).not.toContain("/invoice/"); });
  it("paid receipt says payment received", () => { expect(customerSubject(o, "paid")).toContain("Payment received"); expect(customerHtml({ ...o, paymentStatus: "PAID" }, "paid", "")).toContain("PAID"); });
  it("is skipped when the customer has no email", async () => expect((await sendCustomerEmail({ ...o, customer: { ...o.customer, email: "" } }, "placed")).status).toBe("SKIPPED"));
  it("helpers", () => { expect(invoiceNo(o.orderNumber)).toBe("INV-261023-AB12C"); expect(firstName("  ")).toBe("friend"); });
});
describe("e-mail copies the invoice design", () => {
  const h = customerHtml(o, "placed", "https://shop.test", ["Telegram: t.me/x"]);
  it("has the sky header, clouds, scalloped edge, stamp and footer like the invoice", () => {
    expect(h).toContain("linear-gradient(135deg,#8ECCFF,#BFE3FF)"); expect(h).toContain("/img/email/header.png"); 
    expect(h).toContain("INVOICE DETAILS"); expect(h).toContain("MADE FOR"); expect(h).toContain("border:4px double #8a5a00".replace("#8a5a00", "#D62828")); expect(h).toContain("Little Toys, Big Happiness");
    expect(h).toContain("អរគុណ"); expect(h).toContain("with love, Cloudy Toys"); expect(h).toContain("Telegram: t.me/x"); expect(h).toContain("Caveat"); expect(h).toContain("Nunito");
  });
});
it("inline logo (cid) shows the same logo image even without SITE_URL", () => { const h = customerHtml(o, "placed", "", [], true); expect(h).toContain('src="cid:invoice-logo"'); expect(h).not.toContain("CLOUDY TOYS</div>"); });
it("paid e-mail carries the PAID stamp and not AWAITING PAYMENT", () => { const q = { ...o, method: "QR_IMAGE" as const, paymentStatus: "PAID" as const, paidAt: "2026-10-23T05:00:00Z" }; const h = customerHtml(q, "paid", "", [], true); expect(h).toContain("PAID"); expect(h).not.toContain("AWAITING PAYMENT"); });
