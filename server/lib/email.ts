import type { StoredOrder } from "../../shared/types";
import { methodLabel } from "../../shared/delivery";
import { ADMIN_EMAIL } from "../../shared/admin";
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
export function adminSubject(o: StoredOrder) { return `[Cloudy-Toy] New Order #${o.orderNumber} - ${o.method === "COD" ? "PAY WITH DELIVERY" : "QR PAYMENT (verify manually)"}`; }
export function adminHtml(o: StoredOrder) {
  const note = o.method === "COD"
    ? `<p style="background:#fff3cd;padding:10px"><b>PAY WITH DELIVERY (Phnom Penh):</b> collect <b>${usd(o.totalCents)}</b> in cash when delivering. Not paid yet.</p>`
    : `<p style="background:#fff3cd;padding:10px"><b>QR IMAGE PAYMENT, NOT VERIFIED.</b> The customer may have scanned your QR. Check your bank/Bakong app for <b>${usd(o.totalCents)}</b> with order number ${esc(o.orderNumber)}, then mark it paid in Admin &gt; Orders.</p>`;
  const rows = o.items.map((i) => `<tr><td>${esc(i.name)}</td><td>${esc(i.sku)}</td><td>${i.qty}</td><td>${usd(i.unitCents)}</td><td>${usd(i.lineCents)}</td></tr>`).join("");
  return `<h2>New order #${esc(o.orderNumber)}</h2>${note}<p>Created: ${esc(o.createdAt)}<br>Method: ${methodLabel(o.method)}<br>Payment status: ${o.paymentStatus}<br>Reference: ${esc(o.paymentReference)}</p>
<h3>Customer</h3><p>${esc(o.customer.name)}<br>${esc(o.customer.email || "-")}<br>${esc(o.customer.phone)}<br>Facebook: ${esc(o.customer.facebook ?? "-")}<br>Telegram: ${esc(o.customer.telegram ?? "-")}<br>${o.area === "PHNOM_PENH" ? "Phnom Penh" : "Province"}: ${esc(o.customer.address)}<br>Notes: ${esc(o.customer.notes ?? "-")}</p>
<table border="1" cellpadding="6" cellspacing="0"><tr><th>Item</th><th>SKU</th><th>Qty</th><th>Unit</th><th>Line</th></tr>${rows}</table>
<p>Subtotal ${usd(o.subtotalCents)}<br>Discount ${usd(o.discountCents)}${o.discountCode ? ` (code ${esc(o.discountCode)})` : ""}<br>Delivery ${usd(o.shippingCents)}<br><b>Total ${usd(o.totalCents)} ${o.currency}</b></p>`;
}
const TEST_SENDER = "Cloudy-Toy <onboarding@resend.dev>";
const FREE_MAIL = ["gmail.com", "googlemail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "live.com"];
/** Resend cannot send from free-mail addresses; fall back to its test sender instead of failing every order. */
export function fromAddress(v: string | undefined): string {
  const addr = (v ?? "").trim(); if (!addr) return TEST_SENDER;
  const domain = (addr.match(/@([^>\s]+)/)?.[1] ?? "").toLowerCase();
  return !domain || FREE_MAIL.includes(domain) ? TEST_SENDER : addr;
}
export type SendResult = { status: "SENT" | "SKIPPED" | "FAILED"; detail?: string };
/** Admin inbox: ADMIN_NOTIFICATION_EMAIL if set, otherwise the admin account email. */
export const adminInbox = () => process.env.ADMIN_NOTIFICATION_EMAIL || ADMIN_EMAIL;
/** Plain-text twin of the HTML (mail without a text part is scored more like spam). */
const plain = (h: string) => h.replace(/<\/(p|h[1-6]|tr|table)>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
/** Returns SENT only when Resend confirms with a 2xx. Never claims success otherwise. */
async function deliver(subject: string, html: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { status: "SKIPPED", detail: "Set RESEND_API_KEY in .env.local" };
  try {
    const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromAddress(process.env.EMAIL_FROM), to: [adminInbox()], subject, html, text: plain(html) }) });
    return res.ok ? { status: "SENT" } : { status: "FAILED", detail: `Resend HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
  } catch (e) { return { status: "FAILED", detail: e instanceof Error ? e.message : "network error" }; }
}
export const sendAdminEmail = (o: StoredOrder) => deliver(adminSubject(o), adminHtml(o));

export const claimSubject = (o: StoredOrder) => `[Cloudy-Toy] Customer says PAID #${o.orderNumber} - ${usd(o.totalCents)} - please verify`;
export function claimHtml(o: StoredOrder) {
  return `<p style="background:#fff3cd;padding:10px"><b>CUSTOMER SAYS THEY PAID (NOT VERIFIED).</b> Check your ABA app for <b>${usd(o.totalCents)}</b> with order number <b>${esc(o.orderNumber)}</b>. Expect a screenshot on Telegram/Facebook. When confirmed, open Admin &gt; Orders &gt; Mark as paid.</p>
<p>Order: <b>${esc(o.orderNumber)}</b><br>Total: <b>${usd(o.totalCents)} ${o.currency}</b><br>Customer: ${esc(o.customer.name)}<br>Phone: ${esc(o.customer.phone)}<br>Email: ${esc(o.customer.email)}<br>${o.area === "PHNOM_PENH" ? "Phnom Penh" : "Province"}: ${esc(o.customer.address)}<br>Items: ${esc(o.items.map((i) => `${i.name} x${i.qty}`).join(", "))}</p>`;
}
/** Full order details + "customer says paid" banner. Sent when the customer presses "I have paid" on a QR order. */
export const paidOrderSubject = (o: StoredOrder) => `[Cloudy-Toy] New Order #${o.orderNumber} - QR PAYMENT, CUSTOMER SAYS PAID (verify)`;
const proofNote = (o: StoredOrder) => o.paymentProof ? `<p style="background:#d1f2d1;padding:10px"><b>Payment screenshot uploaded.</b> Open it in Admin &gt; Transactions (order ${esc(o.orderNumber)}).</p>` : "";
export const sendPaidOrderEmail = (o: StoredOrder) => deliver(paidOrderSubject(o), claimHtml(o) + proofNote(o) + "<hr>" + adminHtml(o));
export const sendPaidClaimEmail = (o: StoredOrder) => deliver(claimSubject(o), claimHtml(o));
