import type { StoredOrder } from "../../shared/types";
import { methodLabel, areaLabel } from "../../shared/delivery";
import { ADMIN_EMAIL } from "../../shared/admin";
import { getSettings } from "./settings";
import { contactLines } from "../../shared/invoice";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { customerHtml, customerSubject, adminInvoiceHtml, LOGO_CID, type CustomerMailKind } from "./customerEmail";
import { INVOICE_LOGO } from "../../shared/invoice";
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
export function adminSubject(o: StoredOrder) { return `[Cloudy-Toy] New Order #${o.orderNumber} - ${o.method === "COD" ? "PAY WITH DELIVERY" : "QR PAYMENT (verify manually)"}`; }
const box = (bg: string, html: string) => `<div style="background:${bg};border-radius:14px;padding:12px 16px;font-size:14px;line-height:1.6;margin-top:8px">${html}</div>`;
/** "New Order" e-mail to the shop owner. Same design as the invoice (see customerEmail.ts). `extra` = more banners shown above the order. */
export function adminHtml(o: StoredOrder, extra = "", contact: string[] = [], inlineLogo = false) {
  const note = o.method === "COD"
    ? box("#fff3cd", `<b>PAY WITH DELIVERY (Phnom Penh):</b> collect <b>${usd(o.totalCents)}</b> in cash when delivering. Not paid yet.`)
    : box("#fff3cd", `<b>QR IMAGE PAYMENT, NOT VERIFIED.</b> The customer may have scanned your QR. Check your bank/Bakong app for <b>${usd(o.totalCents)}</b> with order number ${esc(o.orderNumber)}, then mark it paid in Admin &gt; Orders.`);
  return adminInvoiceHtml(o, extra + note, undefined, contact, inlineLogo);
}
const TEST_SENDER = "Cloudy-Toy <onboarding@resend.dev>";
const FREE_MAIL = ["gmail.com", "googlemail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "live.com"];
/** Resend cannot send from free-mail addresses; fall back to its test sender instead of failing every order. */
export function fromAddress(v: string | undefined): string {
  const addr = (v ?? "").trim(); if (!addr) return TEST_SENDER;
  const domain = (addr.match(/@([^>\s]+)/)?.[1] ?? "").toLowerCase();
  return !domain || FREE_MAIL.includes(domain) ? TEST_SENDER : addr;
}
/** The exact logo file the invoice page uses (public/img/invoice-logo.jpg), attached inline so every mail shows it. null if the file cannot be read. */
let logoB64: string | null | undefined;
const logoAttachment = () => {
  if (logoB64 === undefined) { try { logoB64 = readFileSync(join(process.cwd(), "public", INVOICE_LOGO)).toString("base64"); } catch { logoB64 = null; } }
  return logoB64 ? [{ filename: "cloudy-toys-logo.jpg", content: logoB64, content_type: "image/jpeg", content_id: LOGO_CID }] : [];
};
/** Turns Resend's raw error into a sentence the shop owner can act on. The raw text stays in the server log. */
export function friendlyMailError(detail: string | undefined): string {
  const d = detail ?? "";
  if (/HTTP 403/.test(d) && /testing emails|own email|verify a domain/i.test(d)) return `Resend is still in test mode, so it can only email ${adminInbox().split(",")[0].trim() || "your own address"}. To email customers: verify your domain at resend.com/domains, then set EMAIL_FROM to an address on that domain.`;
  if (/HTTP 401/.test(d)) return "Resend rejected the API key. Check RESEND_API_KEY in your environment variables.";
  if (/HTTP 403/.test(d) || /HTTP 422/.test(d)) return "Resend refused this email. Check that your sending domain is verified and EMAIL_FROM uses it.";
  if (/HTTP 429/.test(d)) return "Resend is busy (too many emails at once). Please wait a minute and try again.";
  if (/HTTP 5\d\d/.test(d)) return "Resend had a temporary problem. Please try again in a moment.";
  if (/timeout|aborted|network|fetch failed/i.test(d)) return "Could not reach Resend (network problem). Please try again.";
  return d || "The email could not be sent.";
}
export type SendResult = { status: "SENT" | "SKIPPED" | "FAILED"; detail?: string };
/** Admin inbox: ADMIN_NOTIFICATION_EMAIL if set (comma separated list allowed), otherwise the admin account email. */
export const adminInbox = () => process.env.ADMIN_NOTIFICATION_EMAIL || ADMIN_EMAIL;
const recipients = () => adminInbox().split(",").map((x) => x.trim()).filter(Boolean);
/** Plain-text twin of the HTML (mail without a text part is scored more like spam). */
const plain = (h: string) => h.replace(/<\/(p|h[1-6]|tr|table)>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const validEmail = (v: string | undefined) => !!v && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v);
/** Returns SENT only when Resend confirms with a 2xx. Never throws, and never claims success otherwise.
 *  - Each request times out after 4s (hosting platforms kill slow functions) and network errors / 429 / 5xx are retried once.
 *  - If the configured sender is rejected (4xx, e.g. domain not verified yet), it retries with Resend's test sender, one recipient at a time,
 *    because the test sender is only allowed to reach the Resend account owner: the admin gets the order if ANY inbox is accepted. */
async function deliver(subject: string, html: string, o: StoredOrder, customerTo?: string): Promise<SendResult> {
  try {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) return { status: "SKIPPED", detail: "Set RESEND_API_KEY in your environment variables" };
    const text = plain(html);
    const send = async (from: string, to: string[]): Promise<SendResult> => {
      const body = JSON.stringify({ from, to, subject, html, text, attachments: html.includes(`cid:${LOGO_CID}`) ? logoAttachment() : undefined,
        ...(customerTo ? { reply_to: recipients()[0] } : validEmail(o.customer.email) ? { reply_to: o.customer.email } : {}), // admin mail: reply goes to the customer; customer mail: reply goes to the shop
        headers: { "X-Entity-Ref-ID": `${o.orderNumber}-${Date.now()}` } });
      let detail = "";
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(4000), headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body });
          if (res.ok) return { status: "SENT" };
          detail = `Resend HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`;
          if (res.status !== 429 && res.status < 500) break; // permanent error (bad key, unverified sender...): retrying the same request will not help
        } catch (e) { detail = e instanceof Error ? e.message : "network error"; }
        if (attempt < 2) await wait(500);
      }
      return { status: "FAILED", detail };
    };
    const to = customerTo ? [customerTo] : recipients();
    if (!to.length) return { status: "FAILED", detail: "No admin email configured (ADMIN_NOTIFICATION_EMAIL)" };
    const primary = fromAddress(process.env.EMAIL_FROM);
    let r = await send(primary, to);
    if (!customerTo && r.status === "FAILED" && /HTTP (400|401|403|422)/.test(r.detail ?? "")) { // customers are never sent through the test sender (it can only reach the account owner)
      const first = r.detail;
      if (primary !== TEST_SENDER || to.length > 1) {
        let ok = 0; let last = "";
        for (const one of to) { const x = await send(TEST_SENDER, [one]); if (x.status === "SENT") ok++; else last = x.detail ?? ""; }
        if (ok > 0) return { status: "SENT", detail: `Sent with Resend test sender (${ok}/${to.length} inbox) because the normal sender was rejected (${first}). Verify your domain in Resend to reach every inbox.` };
        r = { status: "FAILED", detail: `${first} | test sender: ${last}` };
      }
    }
    if (r.status === "FAILED") { console.error("[email]", o.orderNumber, r.detail); if (customerTo) r = { ...r, detail: friendlyMailError(r.detail) }; }
    return r;
  } catch (e) {
    const detail = e instanceof Error ? e.message : "unexpected email error"; console.error("[email]", o.orderNumber, detail);
    return { status: "FAILED", detail };
  }
}
const contact = async () => contactLines(await getSettings());
export const sendAdminEmail = async (o: StoredOrder) => deliver(adminSubject(o), adminHtml(o, "", await contact(), logoAttachment().length > 0), o);

export const claimSubject = (o: StoredOrder) => `[Cloudy-Toy] Customer says PAID #${o.orderNumber} - ${usd(o.totalCents)} - please verify`;
export function claimHtml(o: StoredOrder) {
  return `<p style="background:#fff3cd;padding:10px"><b>CUSTOMER SAYS THEY PAID (NOT VERIFIED).</b> Check your ABA app for <b>${usd(o.totalCents)}</b> with order number <b>${esc(o.orderNumber)}</b>. Expect a screenshot on Telegram/Facebook. When confirmed, open Admin &gt; Orders &gt; Mark as paid.</p>
<p>Order: <b>${esc(o.orderNumber)}</b><br>Total: <b>${usd(o.totalCents)} ${o.currency}</b><br>Customer: ${esc(o.customer.name)}<br>Phone: ${esc(o.customer.phone)}<br>Email: ${esc(o.customer.email)}<br>${esc(areaLabel(o))}: ${esc(o.customer.address)}<br>Items: ${esc(o.items.map((i) => `${i.name} x${i.qty}`).join(", "))}</p>`;
}
/** Full order details + "customer says paid" banner. Sent when the customer presses "I have paid" on a QR order. */
export const paidOrderSubject = (o: StoredOrder) => `[Cloudy-Toy] New Order #${o.orderNumber} - QR PAYMENT, CUSTOMER SAYS PAID (verify)`;
const proofNote = (o: StoredOrder) => o.paymentProof ? box("#d1f2d1", `<b>Payment screenshot uploaded.</b> Open it in Admin &gt; Transactions (order ${esc(o.orderNumber)}).`) : "";
const claimNote = (o: StoredOrder) => box("#fff3cd", `<b>CUSTOMER SAYS THEY PAID (NOT VERIFIED).</b> Check your ABA app for <b>${usd(o.totalCents)}</b> with order number <b>${esc(o.orderNumber)}</b>. Expect a screenshot on Telegram/Facebook. When confirmed, open Admin &gt; Orders &gt; Mark as paid.`);
export const sendPaidOrderEmail = async (o: StoredOrder) => deliver(paidOrderSubject(o), adminHtml(o, claimNote(o) + proofNote(o), await contact(), logoAttachment().length > 0), o);
export const sendPaidClaimEmail = (o: StoredOrder) => deliver(claimSubject(o), claimHtml(o), o);

/** Personal invoice e-mail to the customer. SKIPPED when they gave no valid address. Never throws. */
export const sendCustomerEmail = async (o: StoredOrder, kind: CustomerMailKind): Promise<SendResult> =>
  validEmail(o.customer.email) ? deliver(customerSubject(o, kind), customerHtml(o, kind, undefined, await contact(), logoAttachment().length > 0), o, o.customer.email.trim()) : { status: "SKIPPED", detail: "Customer gave no email address" };
