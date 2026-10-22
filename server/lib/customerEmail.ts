// Invoice-styled e-mails (table layout + inline styles: works in Gmail, Outlook, Apple Mail, phones).
// One layout draws both the customer e-mail and the admin "New order" e-mail, and it copies the invoice in the admin dashboard
// (src/components/Invoice.tsx) part by part: sky header with the mascot logo + clouds, scalloped edge, greeting, "Made for" /
// "Invoice details" panels, pill table header, dashed rows, stamp, dark total bar, note, next-step box, footer with thank-you.
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
// Same fonts as the invoice. Web fonts load in Apple Mail / iOS / Gmail app when allowed, other clients fall back to the stacks.
const hand = "'Caveat','Segoe Print','Bradley Hand','Comic Sans MS',cursive";
const body = "'Nunito','Segoe UI',ui-rounded,Arial,'Helvetica Neue',sans-serif";
const khmer = "'Nokora','Noto Sans Khmer','Khmer UI',Arial,sans-serif";
const FONTS = "https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Nunito:wght@400;700;900&family=Nokora:wght@400;700&display=swap";
type Opts = { mode: "customer" | "admin"; kind?: CustomerMailKind; base: string; banner?: string; contact?: string[] };
function invoiceEmail(o: StoredOrder, { mode, kind = "placed", base, banner = "", contact = [] }: Opts): string {
  const admin = mode === "admin", st = invoiceState(o), [tb, tf] = TONE[st.tone], c = o.customer;
  const headline = admin ? `New order ${esc(o.orderNumber)} 🧸` : kind === "paid" ? `We got your payment, ${esc(firstName(c.name))}! 💙` : `Hello, ${esc(firstName(c.name))}! 🧸`;
  const intro = admin ? "A new order just came in. Details are below, in the same layout as the invoice."
    : kind === "paid" ? "Thank you! Your payment is confirmed and we are packing your toys with love. Here is your receipt." : "Thank you so much for shopping with us. Every toy is packed with care, just for you. Here is your invoice.";
  const logo = base
    ? `<img src="${esc(base)}${INVOICE_LOGO}" alt="Cloudy Toys" width="118" height="118" style="display:block;width:118px;height:118px;border-radius:18px;border:5px solid #fff;background:#fff;box-shadow:0 6px 16px rgba(47,65,86,.15)">`
    : `<div style="background:#fff;border-radius:22px;padding:34px 16px;font:900 20px ${body};color:${BRAND.ink};letter-spacing:1px;text-align:center;width:118px">CLOUDY TOYS</div>`;
  const hdrBg = base ? `background-image:url('${esc(base)}/img/email/header.png');background-repeat:no-repeat;background-position:center top;background-size:100% 208px;` : "";
  const scallop = base ? "" : `<tr><td style="height:18px;background:#fff;border-radius:18px 18px 0 0;font-size:0;line-height:0">&nbsp;</td></tr>`;
  const label = (t: string, col = BRAND.mute) => `<div style="font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:${col};font-weight:800;margin:0 0 6px">${t}</div>`;
  const th = (t: string, a: string, r = "") => `<td align="${a}" style="background:${BRAND.sky};color:${BRAND.ink};padding:10px 12px;font-size:12px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;${r}">${t}</td>`;
  const td = (v: string, a: string, x = "") => `<td align="${a}" style="padding:11px 12px;border-bottom:1px dashed ${BRAND.border};font-size:14.5px;${x}">${v}</td>`;
  const rows = o.items.map((i) => `<tr>${td(`<b>${esc(i.name)}</b><br><span style="color:${BRAND.mute};font-size:11.5px">SKU ${esc(i.sku)}</span>`, "left")}${td(String(i.qty), "right")}${td(usd(i.unitCents), "right")}${td(usd(i.lineCents), "right", "font-weight:800;")}</tr>`).join("");
  const line = (k: string, v: string, vs = "") => `<tr><td style="padding:4px 12px 4px 0;color:${BRAND.mute};font-size:14.5px;white-space:nowrap">${k}</td><td align="right" style="padding:4px 0;font-size:14.5px;color:${BRAND.mute};white-space:nowrap;${vs}">${v}</td></tr>`;
  const kv = (k: string, v: string) => `<tr><td style="padding:2px 10px 2px 0;color:${BRAND.mute};font-size:13.5px;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:2px 0;font-size:13.5px;font-weight:bold">${v}</td></tr>`;
  const who = [esc(c.phone), c.email ? esc(c.email) : "", ...(admin ? [`Facebook: ${esc(c.facebook ?? "-")}`, `Telegram: ${esc(c.telegram ?? "-")}`] : []), esc(areaLabel(o)), esc(c.address)].filter(Boolean).join("<br>");
  const details = [kv("Date", `${esc(dateLong(o.createdAt))}, ${esc(timeShort(o.createdAt))}`), kv("Order no.", esc(o.orderNumber)), kv("Payment", esc(methodLabel(o.method))), ...(o.paidAt ? [kv("Paid on", esc(dateLong(o.paidAt)))] : []), ...(admin ? [kv("Status", esc(o.paymentStatus)), kv("Reference", esc(o.paymentReference))] : [])].join("");
  const note = c.notes ? `<tr><td style="padding:16px 36px 0"><div style="background:#FFFBEA;border-radius:14px;padding:10px 14px;font-size:13.5px;line-height:1.55"><b>${admin ? "Customer note" : "Your note"}:</b> ${esc(c.notes)}</div></td></tr>` : "";
  const adminBtn = admin && base ? `<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:18px auto 0"><tr><td style="background:${BRAND.sky};border-radius:999px"><a href="${esc(base)}/admin/invoice/${encodeURIComponent(o.orderNumber)}" style="display:inline-block;padding:13px 26px;font:bold 15px ${body};color:${BRAND.ink};text-decoration:none">🧾 Open invoice (print / download)</a></td></tr></table>` : "";
  const nextBox = admin ? "" : `<tr><td style="padding:16px 36px 0"><div style="background:${BRAND.skyPale};border-radius:16px;padding:12px 16px;font-size:14px;line-height:1.55">💌 ${esc(nextStep(o))}</div></td></tr>`;
  const footRight = `${contact.length ? contact.map((x) => `${esc(x)}<br>`).join("") : admin ? "" : "Questions? Just reply to this email.<br>"}${admin ? "Open <b>Admin &gt; Orders</b> to confirm, print or download this invoice." : "Please keep this invoice for your records."}`;
  const stamp = `<div style="display:inline-block;transform:rotate(-6deg);border:4px double ${tf};color:${tf};border-radius:14px;padding:6px 18px;font-weight:900;letter-spacing:3px;font-size:22px;white-space:nowrap;margin-top:14px">${st.label}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><link href="${FONTS}" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#F4FAFF;font-family:${body}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(admin ? `${usd(o.totalCents)} · ${st.label}` : nextStep(o))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFF"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="760" cellpadding="0" cellspacing="0" style="width:100%;max-width:760px;background:#ffffff;border-radius:28px;overflow:hidden;font-family:${body};color:${BRAND.ink};box-shadow:0 10px 40px rgba(108,184,245,.35)">
<tr><td style="padding:0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${BRAND.sky}" style="background-color:${BRAND.sky};background-image:linear-gradient(135deg,${BRAND.sky},#BFE3FF)">
  <tr><td height="208" valign="top" style="height:208px;padding:0 36px;${hdrBg}"><table role="presentation" width="100%" height="180" cellpadding="0" cellspacing="0"><tr>
    <td valign="middle" align="left" width="128">${logo}</td>
    <td valign="middle" align="right" style="color:${BRAND.ink};white-space:nowrap"><div style="font-family:${hand};font-size:24px;line-height:1.2;color:${BRAND.ink};white-space:nowrap">${BRAND.tagline} ✨</div>
      <div style="font-size:40px;font-weight:900;letter-spacing:3px;line-height:1.15;color:${BRAND.ink};margin:2px 0 4px">INVOICE</div>
      <div style="font-weight:800;font-size:15px;color:${BRAND.ink}">${esc(invoiceNo(o.orderNumber))}</div></td></tr></table></td></tr>
  ${scallop}</table></td></tr>
<tr><td style="padding:6px 36px 0">
  <div style="font-family:${hand};font-size:34px;line-height:1.1;color:#2F4156">${headline}</div>
  <p style="margin:2px 0 0;font-size:15px;line-height:1.5;color:${BRAND.mute}">${intro}</p>
</td></tr>
${banner ? `<tr><td style="padding:14px 36px 0">${banner}</td></tr>` : ""}
<tr><td style="padding:20px 36px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td width="49%" valign="top" style="background:${BRAND.skyPale};border-radius:20px;padding:16px 18px;font-size:13.5px;line-height:1.55">${label(admin ? "CUSTOMER" : "MADE FOR")}<div style="font-weight:900;font-size:17px;text-transform:capitalize;line-height:1.3">${esc(c.name)}</div><div style="margin-top:4px">${who}</div></td>
  <td width="2%" style="font-size:0;line-height:0">&nbsp;</td>
  <td width="49%" valign="top" style="background:#FFF6F9;border-radius:20px;padding:16px 18px">${label("INVOICE DETAILS", "#c56a86")}<table role="presentation" cellpadding="0" cellspacing="0">${details}</table>
    <div style="margin-top:8px"><span style="display:inline-block;white-space:nowrap;background:${tb};color:${tf};font-weight:900;font-size:12px;letter-spacing:1.2px;padding:5px 14px;border-radius:999px">${st.label}</span></div></td>
</tr></table></td></tr>
<tr><td style="padding:22px 36px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>${th("PRODUCT", "left", "border-radius:14px 0 0 14px;")}${th("QTY", "right")}${th("PRICE", "right")}${th("AMOUNT", "right", "border-radius:0 14px 14px 0;")}</tr>${rows}</table></td></tr>
<tr><td style="padding:16px 36px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td valign="bottom" style="padding:0 12px 6px 0">${stamp}</td>
  <td valign="top" width="290" style="white-space:nowrap"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${line("Subtotal", usd(o.subtotalCents))}${o.discountCents > 0 ? line(`Discount${o.discountCode ? ` (${esc(o.discountCode)})` : ""}`, `−${usd(o.discountCents)}`, `color:${BRAND.red};font-weight:bold;`) : ""}${line("Delivery", usd(o.shippingCents))}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px"><tr><td style="background:${BRAND.ink};color:#ffffff;border-radius:18px 0 0 18px;padding:12px 0 12px 18px;font-size:20px;font-weight:900">Total</td><td align="right" style="background:${BRAND.ink};color:#ffffff;border-radius:0 18px 18px 0;padding:12px 18px 12px 0;font-size:20px;font-weight:900;white-space:nowrap">${usd(o.totalCents)} ${o.currency}</td></tr></table></td></tr></table></td></tr>
${note}${nextBox}
${adminBtn ? `<tr><td style="padding:0 36px">${adminBtn}</td></tr>` : ""}
<tr><td style="padding:26px 0 0;font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="background:${BRAND.skyPale};padding:18px 36px 22px;border-top:2px dashed ${BRAND.border}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td valign="middle"><div style="font-family:${hand};font-size:30px;line-height:1.2;color:${BRAND.ink};white-space:nowrap"><span style="font-family:${khmer};font-size:24px">អរគុណ</span> · Thank you! 💙</div><div style="margin-top:4px;font-family:${hand};font-size:22px;color:${BRAND.ink}">with love, ${BRAND.name}</div></td>
  <td valign="middle" align="right" style="font-size:12.5px;line-height:1.6;color:${BRAND.ink}">${footRight}</td></tr></table></td></tr>
</table></td></tr></table></body></html>`;
}
export const customerHtml = (o: StoredOrder, kind: CustomerMailKind = "placed", base: string = siteUrl(), contact: string[] = []) => invoiceEmail(o, { mode: "customer", kind, base, contact });
/** The "New Order" e-mail for the shop owner: same design as the invoice; `banner` holds the red/yellow payment instructions. */
export const adminInvoiceHtml = (o: StoredOrder, banner: string, base: string = siteUrl(), contact: string[] = []) => invoiceEmail(o, { mode: "admin", base, banner, contact });
