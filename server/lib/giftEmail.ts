// Receipts for the points gift exchange: one e-mail to the admin (so the gift can be handed over) and a friendly copy to the customer.
import { deliver, adminInbox, type SendResult } from "./email";
import { esc } from "./customerEmail";
import type { Redemption } from "../../shared/gifts";

export type GiftReceiptInfo = { redemption: Redemption; email: string; name: string; phone: string; address: string; facebook: string; telegram: string; balanceAfter: number; tierName?: string };
const ref = (g: GiftReceiptInfo) => ({ orderNumber: `GIFT-${g.redemption.id}`, customer: { name: g.name, email: g.email, phone: g.phone, address: g.address }, items: [{ productId: g.redemption.giftId, sku: "", name: g.redemption.giftName, qty: 1, unitCents: 0, lineCents: 0 }] });
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Phnom_Penh", dateStyle: "medium", timeStyle: "short" }) + " (Phnom Penh)";
const row = (k: string, v: string) => `<tr><td style="padding:6px 0;color:#667085;width:140px">${esc(k)}</td><td style="padding:6px 0;font-weight:700;color:#1d2a55">${v}</td></tr>`;
const shell = (title: string, intro: string, g: GiftReceiptInfo, extraRows: string, foot: string) => {
  const r = g.redemption; const img = r.giftImage && /^https?:\/\//.test(r.giftImage) ? `<img src="${esc(r.giftImage)}" alt="" width="96" height="96" style="border-radius:14px;object-fit:cover;display:block;margin:0 0 12px"/>` : "";
  return `<!doctype html><html><body style="margin:0;background:#EAF3FF;font-family:Arial,Helvetica,sans-serif;color:#1d2a55"><div style="max-width:560px;margin:0 auto;padding:20px"><div style="background:#fff;border-radius:22px;padding:24px;border:1px solid #D6E6FB">
<h1 style="margin:0 0 6px;font-size:22px;color:#2B1A8F">${esc(title)}</h1><p style="margin:0 0 14px;font-size:15px;line-height:1.5">${intro}</p>${img}
<table style="width:100%;border-collapse:collapse;font-size:14px">${row("Gift", esc(r.giftName))}${row("Points used", `${r.points} pts`)}${row("Points left", `${g.balanceAfter} pts`)}${row("Receipt no.", esc(`GIFT-${r.id}`))}${row("Date", esc(when(r.createdAt)))}${extraRows}</table>
<p style="margin:16px 0 0;font-size:13px;color:#667085;line-height:1.5">${foot}</p></div></div></body></html>`;
};
/** Admin copy: who exchanged what, and how to reach them to hand the gift over. */
export async function sendGiftAdminEmail(g: GiftReceiptInfo): Promise<SendResult> {
  const extra = row("Customer", esc(g.name)) + row("Email", esc(g.email)) + row("Phone", esc(g.phone || "-")) + row("Address", esc(g.address || "-")) + (g.facebook ? row("Facebook", esc(g.facebook)) : "") + (g.telegram ? row("Telegram", esc(g.telegram)) : "") + (g.tierName ? row("Level", esc(g.tierName)) : "");
  const html = shell("New gift exchange", `<b>${esc(g.name)}</b> exchanged points for a gift. Please contact them and hand it over, then press <b>Received</b> in Admin &gt; Membership &gt; Gifts.`, g, extra, "Status: waiting for hand-over. If you cancel it in the admin, the points and the stock go back automatically.");
  return deliver(`\u{1F381} Gift exchange ${g.redemption.points} pts | ${g.name.slice(0, 24)} | ${g.redemption.giftName.slice(0, 40)} | GIFT-${g.redemption.id}`, html, ref(g));
}
/** Customer copy: a warm receipt. */
export async function sendGiftCustomerEmail(g: GiftReceiptInfo): Promise<SendResult> {
  if (!g.email) return { status: "SKIPPED", detail: "No customer email" };
  const html = shell(`Your gift is on its way, ${g.name.split(" ")[0] || "friend"}!`, `Thank you for being part of Cloudy Toys! You exchanged your points for a gift. We will contact you soon to hand it over.`, g, "", `Keep this email as your receipt. Questions? Just reply to this email and we will help you.`);
  return deliver(`Your Cloudy Toys gift receipt (GIFT-${g.redemption.id})`, html, ref(g), g.email);
}
export { adminInbox };
