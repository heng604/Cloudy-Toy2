// Personal, customer-facing invoice e-mail (table layout + inline styles: works in Gmail, Outlook, Apple Mail, phones).
import type { StoredOrder } from "../../shared/types";
import { areaLabel, methodLabel } from "../../shared/delivery";
import { BRAND, usd, invoiceNo, firstName, dateLong, invoiceState, nextStep } from "../../shared/invoice";
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export type CustomerMailKind = "placed" | "paid";
/** Public address of the shop, e.g. https://cloudytoys.com (no trailing slash). Needed for the logo and the invoice button. */
export const siteUrl = () => (process.env.SITE_URL ?? "").trim().replace(/\/+$/, "");
export const customerSubject = (o: StoredOrder, kind: CustomerMailKind) =>
  kind === "paid" ? `Payment received, thank you ${firstName(o.customer.name)}! 💙 (${o.orderNumber})` : `Thank you, ${firstName(o.customer.name)}! Your Cloudy Toys invoice ${invoiceNo(o.orderNumber)} 🧸`;
const TONE = { green: ["#DDF6E3", "#1f7a3a"], amber: ["#FFF1CC", "#8a5a00"], blue: ["#E1F0FF", "#1d5fa8"] } as const;
export function customerHtml(o: StoredOrder, kind: CustomerMailKind = "placed", base: string = siteUrl()): string {
  const st = invoiceState(o), [tb, tf] = TONE[st.tone], c = o.customer, hand = "'Segoe Print','Bradley Hand','Comic Sans MS',cursive";
  const headline = kind === "paid" ? `We got your payment, ${esc(firstName(c.name))}! 💙` : `Hello, ${esc(firstName(c.name))}! 🧸`;
  const intro = kind === "paid" ? "Thank you! Your payment is confirmed and we are packing your toys with love. Here is your receipt." : "Thank you so much for your order. We are so happy you chose Cloudy Toys! Here is your invoice.";
  const logo = base ? `<img src="${esc(base)}/img/logo.png" alt="Cloudy Toys" width="150" style="display:block;margin:0 auto;border-radius:16px;background:#fff;max-width:150px;height:auto">` : `<div style="font:900 26px Arial,sans-serif;color:${BRAND.ink};letter-spacing:1px">CLOUDY TOYS</div>`;
  const rows = o.items.map((i) => `<tr><td style="padding:10px 8px;border-bottom:1px dashed ${BRAND.border};font-size:14px"><b>${esc(i.name)}</b><br><span style="color:${BRAND.mute};font-size:12px">${esc(i.sku)} · ${usd(i.unitCents)} each</span></td><td align="center" style="padding:10px 8px;border-bottom:1px dashed ${BRAND.border};font-size:14px">×${i.qty}</td><td align="right" style="padding:10px 8px;border-bottom:1px dashed ${BRAND.border};font-size:14px;font-weight:bold">${usd(i.lineCents)}</td></tr>`).join("");
  const line = (k: string, v: string, extra = "") => `<tr><td style="padding:3px 0;color:${BRAND.mute};font-size:14px;${extra}">${k}</td><td align="right" style="padding:3px 0;font-size:14px;${extra}">${v}</td></tr>`;
  const button = base ? `<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:22px auto 4px"><tr><td style="background:${BRAND.sky};border-radius:999px"><a href="${esc(base)}/invoice/${encodeURIComponent(o.orderNumber)}" style="display:inline-block;padding:13px 26px;font:bold 15px Arial,sans-serif;color:${BRAND.ink};text-decoration:none">🧾 View &amp; download my invoice</a></td></tr></table>` : "";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#F4FAFF">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(nextStep(o))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFF"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;font-family:Arial,'Helvetica Neue',sans-serif;color:${BRAND.ink}">
<tr><td align="center" style="background:${BRAND.sky};padding:26px 20px 22px">${logo}<div style="font-family:${hand};font-size:19px;color:#ffffff;margin-top:10px">${BRAND.tagline} ✨</div></td></tr>
<tr><td style="padding:26px 28px 6px">
  <div style="font-family:${hand};font-size:30px;color:${BRAND.skyDeep};line-height:1.2">${headline}</div>
  <p style="margin:8px 0 0;font-size:15px;line-height:1.6;color:${BRAND.ink}">${intro}</p>
  <p style="margin:14px 0 0"><span style="display:inline-block;background:${tb};color:${tf};font-weight:bold;font-size:12px;letter-spacing:1px;padding:5px 14px;border-radius:999px">${st.label}</span></p>
</td></tr>
<tr><td style="padding:16px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.skyPale};border-radius:16px"><tr><td style="padding:14px 16px;font-size:13.5px;line-height:1.6">
  <b style="font-size:12px;letter-spacing:1px;color:${BRAND.mute}">INVOICE</b><br><b>${esc(invoiceNo(o.orderNumber))}</b> · ${esc(dateLong(o.createdAt))}<br>
  Order ${esc(o.orderNumber)} · ${esc(methodLabel(o.method))}</td>
  <td style="padding:14px 16px;font-size:13.5px;line-height:1.6" align="right"><b style="font-size:12px;letter-spacing:1px;color:${BRAND.mute}">DELIVER TO</b><br><b style="text-transform:capitalize">${esc(c.name)}</b><br>${esc(c.phone)}<br>${esc(areaLabel(o))}: ${esc(c.address)}</td></tr></table></td></tr>
<tr><td style="padding:14px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="background:${BRAND.sky};padding:8px;font-size:12px;font-weight:bold;letter-spacing:1px;border-radius:12px 0 0 12px">TOY</td><td align="center" style="background:${BRAND.sky};padding:8px;font-size:12px;font-weight:bold;letter-spacing:1px">QTY</td><td align="right" style="background:${BRAND.sky};padding:8px;font-size:12px;font-weight:bold;letter-spacing:1px;border-radius:0 12px 12px 0">AMOUNT</td></tr>${rows}</table></td></tr>
<tr><td style="padding:10px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  ${line("Subtotal", usd(o.subtotalCents))}${o.discountCents > 0 ? line(`Discount${o.discountCode ? ` (${esc(o.discountCode)})` : ""}`, `−${usd(o.discountCents)}`, "color:#1f7a3a;font-weight:bold;") : ""}${line("Delivery", usd(o.shippingCents))}</table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px"><tr><td style="background:${BRAND.ink};color:#ffffff;border-radius:14px;padding:13px 18px;font-size:19px;font-weight:bold">Total</td><td align="right" style="background:${BRAND.ink};color:#ffffff;border-radius:14px;padding:13px 18px;font-size:19px;font-weight:bold">${usd(o.totalCents)} ${o.currency}</td></tr></table></td></tr>
<tr><td style="padding:16px 28px 0"><div style="background:#FFF6F9;border-radius:16px;padding:14px 16px;font-size:14px;line-height:1.6">💌 ${esc(nextStep(o))}</div>${button}</td></tr>
<tr><td align="center" style="padding:22px 28px 26px"><div style="font-family:${hand};font-size:24px;color:${BRAND.skyDeep}"><span style="font-family:'Khmer UI','Noto Sans Khmer',Arial,sans-serif;font-size:20px">អរគុណ</span> · Thank you! 💙</div><div style="font-family:${hand};font-size:17px;color:${BRAND.ink};margin-top:2px">with love, Cloudy Toys</div>
  <p style="margin:12px 0 0;font-size:12px;color:${BRAND.mute};line-height:1.6">Just reply to this email if you have any question about your order.</p></td></tr>
</table></td></tr></table></body></html>`;
}
