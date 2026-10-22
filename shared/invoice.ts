// Pure helpers shared by the invoice page (image/print) and the customer e-mail, so both always say the same thing.
import type { StoredOrder } from "./types";
export const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
/** "CT-261023-AB12C" -> "INV-261023-AB12C" */
export const invoiceNo = (orderNumber: string) => `INV-${orderNumber.replace(/^CT-/, "")}`;
/** "sok dara" -> "Sok" (used for the personal greeting). Falls back to "friend". */
export const firstName = (full: string) => { const w = full.trim().split(/\s+/)[0] ?? ""; return w ? w.charAt(0).toUpperCase() + w.slice(1) : "friend"; };
/** 23 October 2026 (Cambodia time, so the date never shifts for the shop owner). */
export const dateLong = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Phnom_Penh" });
export const timeShort = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Phnom_Penh" });
export type InvoiceState = { label: "PAID" | "PAY ON DELIVERY" | "AWAITING PAYMENT"; tone: "green" | "amber" | "blue" };
export const invoiceState = (o: StoredOrder): InvoiceState =>
  o.paymentStatus === "PAID" ? { label: "PAID", tone: "green" } : o.method === "COD" ? { label: "PAY ON DELIVERY", tone: "blue" } : { label: "AWAITING PAYMENT", tone: "amber" };
/** One warm sentence that tells the customer what happens next. */
export function nextStep(o: StoredOrder): string {
  if (o.paymentStatus === "PAID") return "Your payment is confirmed. We are packing your toys with love and will deliver them soon.";
  if (o.method === "COD") return `Please keep ${usd(o.totalCents)} in cash ready for our delivery driver. We will call you before we arrive.`;
  return o.paymentProof || o.claimedPaidAt
    ? "Thank you for sending your payment screenshot. We are checking it now and will confirm your order very soon."
    : `Please pay ${usd(o.totalCents)} by scanning our QR code and write ${o.orderNumber} in the note. Then send us the screenshot so we can confirm.`;
}
export const BRAND = { name: "Cloudy Toys", tagline: "Little Toys, Big Happiness", sky: "#8ECCFF", skyDeep: "#6CB8F5", skyPale: "#EAF5FF", border: "#D8EAFE", ink: "#2f4156", mute: "#64748B", pink: "#FFB6C8" };
