// Orders in Supabase (table public.orders). Permanent: nothing is lost unless an admin explicitly deletes it.
import { db, must } from "./db";
import type { StoredOrder } from "../../shared/types";
export type { StoredOrder };
const d = (c: number) => c / 100;
const toRow = (o: StoredOrder) => ({
  order_number: o.orderNumber, customer_name: o.customer.name, customer_email: o.customer.email.toLowerCase(), customer_phone: o.customer.phone,
  shipping_address: { address: o.customer.address, area: o.area }, delivery_instructions: o.customer.notes ?? null,
  subtotal: d(o.subtotalCents), discount: d(o.discountCents), shipping_fee: d(o.shippingCents), total: d(o.totalCents), currency: o.currency,
  payment_status: o.paymentStatus, created_at: o.createdAt, updated_at: new Date().toISOString(), data: o,
});
type Row = { data: StoredOrder | null };
const fromRows = (rows: Row[] | null) => (rows ?? []).map((r) => r.data).filter((x): x is StoredOrder => !!x);

export async function saveOrder(o: StoredOrder) { must(await db().from("orders").insert(toRow(o)).select("order_number").single()); }
export async function getOrder(n: string) { const r = await db().from("orders").select("data").eq("order_number", n).maybeSingle(); return (must(r) as Row | null)?.data ?? null; }
export async function updateOrder(n: string, fn: (o: StoredOrder) => void) {
  const o = await getOrder(n); if (!o) return null;
  fn(o); must(await db().from("orders").update(toRow(o)).eq("order_number", n).select("order_number").single()); return o;
}
export async function listOrdersByEmail(email: string) { return fromRows(must(await db().from("orders").select("data").eq("customer_email", email.toLowerCase()).order("created_at", { ascending: false }))); }
export async function listAllOrders() { return fromRows(must(await db().from("orders").select("data").order("created_at", { ascending: false }))); }
/** Permanently deletes EVERY order (used by Admin > Transactions > Clear all). Returns how many were removed. */
export async function deleteAllOrders() {
  const rows = must(await db().from("orders").delete().neq("order_number", "").select("order_number")) as unknown[] | null;
  return rows?.length ?? 0;
}
