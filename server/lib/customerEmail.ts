// Invoice-styled e-mails (table layout + inline styles: works in Gmail, Outlook, Apple Mail, phones).
// One layout draws both the customer e-mail and the admin "New order" e-mail, so they always match the invoice in the admin dashboard.
// Customers get NO invoice link: invoices can only be opened, printed or downloaded by the admin (Admin > Orders).
import type { StoredOrder } from "../../shared/types";
import { areaLabel, methodLabel } from "../../shared/delivery";
import { BRAND, INVOICE_LOGO, usd, invoiceNo, firstName, dateLong, timeShort, invoiceState, nextStep } from "../../shared/invoice";
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export type CustomerMailKind = "placed" | "paid";
/** Public address of the shop, e.g. https://cloudytoys.com (no trailing slash). Needed for the logo and the admin invoice button. */
export const siteUrl = () => (process.env.SITE_URL ?? "").trim().replace(/\/+$/, "");
export const customerSubject = (o: StoredOrder, kind: CustomerMailKind) =>
  kind === "paid" ? `Payment received, thank you ${firstName(o.customer.name)}! 💙 (${o.orderNumber})` : `Thank you, ${firstName(o.customer.name)}! Your Cloudy Toys invoice ${invoiceNo(o.orderNumber)} 🧸`;
const TONE = { green: ["#DDF6E3", "#1f7a3a"], amber: ["#FFF1CC", "#8a5a00"], red: [BRAND.redPale, BRAND.red] } as const;
const hand = "'Segoe Print','Bradley Hand','Comic Sans MS',cursive";
type Opts = { mode: "customer" | "admin"; kind?: CustomerMailKind; base: string; banner?: string };
function invoiceEmail(o: StoredOrder, { mode, kind = "placed", base, banner = "" }: Opts): string {
  const admin = mode === "admin", st = invoiceState(o), [tb, tf] = TONE[st.tone], c = o.customer;
  const headline = admin ? `New order ${esc(o.orderNumber)} 🧸` : kind === "paid" ? `We got your payment, ${esc(firstName(c.name))}! 💙` : `Hello, ${esc(firstName(c.name))}! 🧸`;
  const intro = admin ? "A new order just came in. Details are below, in the same layout as the invoice."
    : kind === "paid" ? "Thank you! Your payment is confirmed and we are packing your toys with love. Here is your receipt." : "Thank you so much for your order. We are so happy you chose Cloudy Toys! Here is your invoice.";
  const logo = base ? `<img src="${esc(base)}${INVOICE_LOGO}" alt="Cloudy Toys" width="120" height="120" style="display:block;margin:0 auto;border-radius:22px;background:#fff;border:5px solid #fff;width:120px;height:120px">` : `<div style="font:900 26px Arial,sans-serif;color:${BRAND.ink};letter-spacing:1px">CLOUDY TOYS</div>`;
  const th = (t: string, a: string, r = "") => `<td align="${a}" style="background:${BRAND.sky};color:${BRAND.ink};padding:8px;font-size:12px;font-weight:bold;letter-spacing:1px;${r}">${t}</td>`;
  const td = (v: string, a: string, x = "") => `<td align="${a}" style="padding:10px 8px;border-bottom:1px dashed ${BRAND.border};font-size:14px;${x}">${v}</td>`;
  const rows = o.items.map((i) => `<tr>${td(`<b>${esc(i.name)}</b><br><span style="color:${BRAND.mute};font-size:12px">SKU ${esc(i.sku)}</span>`, "left")}${td(String(i.qty), "right")}${td(usd(i.unitCents), "right")}${td(usd(i.lineCents), "right", "font-weight:bold;")}</tr>`).join("");
  const line = (k: string, v: string, vs = "") => `<tr><td style="padding:3px 0;color:${BRAND.mute};font-size:14px">${k}</td><td align="right" style="padding:3px 0;font-size:14px;color:${BRAND.mute};${vs}">${v}</td></tr>`;
  const kv = (k: string, v: string) => `<tr><td style="padding:2px 10px 2px 0;color:${BRAND.mute};font-size:13.5px;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:2px 0;font-size:13.5px;font-weight:bold">${v}</td></tr>`;
  const who = [esc(c.phone), c.email ? esc(c.email) : "", ...(admin ? [`Facebook: ${esc(c.facebook ?? "-")}`, `Telegram: ${esc(c.telegram ?? "-")}`] : []), `${esc(areaLabel(o))}: ${esc(c.address)}`].filter(Boolean).join("<br>");
  const details = [kv("Date", `${esc(dateLong(o.createdAt))}, ${esc(timeShort(o.createdAt))}`), kv("Order no.", esc(o.orderNumber)), kv("Payment", esc(methodLabel(o.method))), ...(o.paidAt ? [kv("Paid on", esc(dateLong(o.paidAt)))] : []), ...(admin ? [kv("Status", esc(o.paymentStatus)), kv("Reference", esc(o.paymentReference))] : [])].join("");
  const note = c.notes ? `<tr><td style="padding:14px 28px 0"><div style="background:#FFFBEA;border-radius:14px;padding:10px 14px;font-size:13.5px;line-height:1.6"><b>${admin ? "Customer note" : "Your note"}:</b> ${esc(c.notes)}</div></td></tr>` : "";
  const adminBtn = admin && base ? `<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:18px auto 0"><tr><td style="background:${BRAND.sky};border-radius:999px"><a href="${esc(base)}/admin/invoice/${encodeURIComponent(o.orderNumber)}" style="display:inline-block;padding:13px 26px;font:bold 15px Arial,sans-serif;color:${BRAND.ink};text-decoration:none">🧾 Open invoice (print / download)</a></td></tr></table>` : "";
  const nextBox = admin ? "" : `<tr><td style="padding:16px 28px 0"><div style="background:#FFF6F9;border-radius:16px;padding:14px 16px;font-size:14px;line-height:1.6">💌 ${esc(nextStep(o))}</div></td></tr>`;
  const footer = admin ? `Open <b>Admin &gt; Orders</b> to confirm, print or download this invoice.` : "Just reply to this email if you have any question about your order.";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#F4FAFF">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(admin ? `${usd(o.totalCents)} · ${st.label}` : nextStep(o))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFF"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;font-family:Arial,'Helvetica Neue',sans-serif;color:${BRAND.ink}">
<tr><td align="center" style="background:${BRAND.sky};padding:26px 20px 22px">${logo}<div style="font-family:${hand};font-size:19px;color:${BRAND.ink};margin-top:10px">${BRAND.tagline} ✨</div>
  <div style="font-size:26px;font-weight:900;letter-spacing:3px;color:${BRAND.ink};margin-top:6px">INVOICE</div><div style="font-size:14px;font-weight:bold;color:${BRAND.ink}">${esc(invoiceNo(o.orderNumber))}</div></td></tr>
<tr><td style="padding:24px 28px 6px">
  <div style="font-family:${hand};font-size:30px;color:${BRAND.ink};line-height:1.2">${headline}</div>
  <p style="margin:8px 0 0;font-size:15px;line-height:1.6;color:${BRAND.mute}">${intro}</p>
  <p style="margin:14px 0 0"><span style="display:inline-block;background:${tb};color:${tf};border:2px solid ${tf};font-weight:bold;font-size:12px;letter-spacing:1px;padding:4px 14px;border-radius:999px">${st.label}</span></p>
</td></tr>
${banner ? `<tr><td style="padding:12px 28px 0">${banner}</td></tr>` : ""}
<tr><td style="padding:16px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td width="50%" valign="top" style="background:${BRAND.skyPale};border-radius:16px;padding:14px 16px;font-size:13.5px;line-height:1.6"><b style="font-size:11px;letter-spacing:1.6px;color:${BRAND.mute}">${admin ? "CUSTOMER" : "MADE FOR"}</b><br><b style="font-size:16px;text-transform:capitalize">${esc(c.name)}</b><br>${who}</td>
  <td width="12" style="font-size:0">&nbsp;</td>
  <td width="50%" valign="top" style="background:#FFF6F9;border-radius:16px;padding:14px 16px"><b style="font-size:11px;letter-spacing:1.6px;color:#c56a86">INVOICE DETAILS</b><table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:4px">${details}</table></td>
</tr></table></td></tr>
<tr><td style="padding:16px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>${th("PRODUCT", "left", "border-radius:12px 0 0 12px;")}${th("QTY", "right")}${th("PRICE", "right")}${th("AMOUNT", "right", "border-radius:0 12px 12px 0;")}</tr>${rows}</table></td></tr>
<tr><td style="padding:10px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  ${line("Subtotal", usd(o.subtotalCents))}${o.discountCents > 0 ? line(`Discount${o.discountCode ? ` (${esc(o.discountCode)})` : ""}`, `−${usd(o.discountCents)}`, `color:${BRAND.red};font-weight:bold;`) : ""}${line("Delivery", usd(o.shippingCents))}</table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px"><tr><td style="background:${BRAND.ink};color:#ffffff;border-radius:14px 0 0 14px;padding:13px 18px;font-size:19px;font-weight:bold">Total</td><td align="right" style="background:${BRAND.ink};color:#ffffff;border-radius:0 14px 14px 0;padding:13px 18px;font-size:19px;font-weight:bold">${usd(o.totalCents)} ${o.currency}</td></tr></table></td></tr>
${note}${nextBox}
<tr><td style="padding:0 28px">${adminBtn}</td></tr>
<tr><td align="center" style="padding:22px 28px 26px"><div style="font-family:${hand};font-size:24px;color:${BRAND.ink}"><span style="font-family:'Khmer UI','Noto Sans Khmer',Arial,sans-serif;font-size:20px">អរគុណ</span> · Thank you! 💙</div><div style="font-family:${hand};font-size:17px;color:${BRAND.ink};margin-top:2px">with love, Cloudy Toys</div>
  <p style="margin:12px 0 0;font-size:12px;color:${BRAND.ink};line-height:1.6">${footer}</p></td></tr>
</table></td></tr></table></body></html>`;
}
export const customerHtml = (o: StoredOrder, kind: CustomerMailKind = "placed", base: string = siteUrl()) => invoiceEmail(o, { mode: "customer", kind, base });
/** The "New Order" e-mail for the shop owner: same design as the invoice; `banner` holds the red/yellow payment instructions. */
export const adminInvoiceHtml = (o: StoredOrder, banner: string, base: string = siteUrl()) => invoiceEmail(o, { mode: "admin", base, banner });
