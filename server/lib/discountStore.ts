// Discount codes in Supabase (table public.store_discounts). Server-only; created by the admin.
// A code takes 10-50% off the cart SUBTOTAL. There are no per-item discounts.
import { db, must } from "./db";
import { subtotalCodeDiscount, type DiscountResult } from "../../shared/discount";
export type StoreDiscount = { code: string; percent: number; createdAt: string };
export async function listStoreDiscounts(): Promise<StoreDiscount[]> {
  const rows = must(await db().from("store_discounts").select("code,percent,created_at").order("created_at", { ascending: true })) as { code: string; percent: number | string; created_at: string }[];
  return rows.map((r) => ({ code: r.code, percent: Number(r.percent), createdAt: r.created_at }));
}
async function getStoreDiscountPercent(code: string): Promise<number | null> {
  const r = must(await db().from("store_discounts").select("percent").eq("code", code).maybeSingle()) as { percent: number | string } | null;
  return r ? Number(r.percent) : null;
}
/** Returns false when the code already exists. */
export async function createStoreDiscount(code: string, percent: number): Promise<boolean> {
  if ((await getStoreDiscountPercent(code)) !== null) return false;
  must(await db().from("store_discounts").insert({ code, percent }).select("code")); return true;
}
/** Change the % of an existing code. Returns false when the code does not exist. */
export async function updateStoreDiscount(code: string, percent: number): Promise<boolean> {
  const rows = must(await db().from("store_discounts").update({ percent }).eq("code", code).select("code")) as unknown[];
  return rows.length > 0;
}
export async function deleteStoreDiscount(code: string) { must(await db().from("store_discounts").delete().eq("code", code).select("code")); }
/** What a typed code is worth: its % off the whole cart subtotal. Unknown code = no discount. */
export const resolveDiscount = async (code: string, items: { lineCents: number }[]): Promise<DiscountResult> => {
  const pct = await getStoreDiscountPercent(code);
  if (pct === null) return { ok: false, error: "That discount code is not valid." };
  return subtotalCodeDiscount(items.reduce((s, i) => s + i.lineCents, 0), pct);
};
