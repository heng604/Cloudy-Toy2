// Per-product discounts in Supabase (table public.product_discounts). Server-only; managed by the admin in the product form.
import { db, must } from "./db";
import { productCodeDiscount, subtotalCodeDiscount, type DiscountResult } from "../../shared/discount";
import type { ProductDiscount } from "../../shared/types";
export type { ProductDiscount };
export async function getProductDiscount(productId: string): Promise<ProductDiscount | null> {
  const r = must(await db().from("product_discounts").select("code,percent").eq("product_id", productId).maybeSingle()) as { code: string; percent: number | string } | null;
  return r ? { code: r.code, percent: Number(r.percent) } : null;
}
/** Pass null to remove the discount from the product. */
export async function setProductDiscount(productId: string, d: ProductDiscount | null) {
  if (!d) { must(await db().from("product_discounts").delete().eq("product_id", productId).select("product_id")); return; }
  must(await db().from("product_discounts").upsert({ product_id: productId, code: d.code, percent: d.percent }).select("product_id"));
}
export async function percentByProductForCode(code: string) {
  const rows = must(await db().from("product_discounts").select("product_id,percent").eq("code", code)) as { product_id: string; percent: number | string }[];
  return new Map(rows.map((r) => [r.product_id, Number(r.percent)]));
}
/* ---- store-wide codes (% off the whole subtotal) ---- */
export type StoreDiscount = { code: string; percent: number; createdAt: string };
export async function listStoreDiscounts(): Promise<StoreDiscount[]> {
  const rows = must(await db().from("store_discounts").select("code,percent,created_at").order("created_at", { ascending: true })) as { code: string; percent: number | string; created_at: string }[];
  return rows.map((r) => ({ code: r.code, percent: Number(r.percent), createdAt: r.created_at }));
}
async function getStoreDiscountPercent(code: string): Promise<number | null> {
  const r = must(await db().from("store_discounts").select("percent").eq("code", code).maybeSingle()) as { percent: number | string } | null;
  return r ? Number(r.percent) : null;
}
/** Returns false when the code already exists as a store code or as a product code. */
export async function createStoreDiscount(code: string, percent: number): Promise<boolean> {
  if ((await getStoreDiscountPercent(code)) !== null) return false;
  const used = must(await db().from("product_discounts").select("product_id").eq("code", code).limit(1)) as unknown[];
  if (used.length) return false;
  must(await db().from("store_discounts").insert({ code, percent }).select("code")); return true;
}
export async function deleteStoreDiscount(code: string) { must(await db().from("store_discounts").delete().eq("code", code).select("code")); }
/** Every per-product discount, newest product first, for the admin list (each one can be deleted on its own). */
export async function listProductDiscounts() {
  const rows = must(await db().from("product_discounts").select("product_id,code,percent,products(name,sku)").order("created_at", { ascending: false })) as unknown as { product_id: string; code: string; percent: number | string; products: { name: string; sku: string } | { name: string; sku: string }[] | null }[];
  return rows.map((r) => { const p = Array.isArray(r.products) ? r.products[0] : r.products; return { productId: r.product_id, code: r.code, percent: Number(r.percent), name: p?.name ?? "(deleted product)", sku: p?.sku ?? "" }; });
}
/** Decides what a typed code is worth: a store-wide code takes its % off the subtotal, otherwise the % set on the products that own the code. */
export const resolveDiscount = async (code: string, items: { productId: string; lineCents: number }[]): Promise<DiscountResult> => {
  const pct = await getStoreDiscountPercent(code);
  if (pct !== null) return subtotalCodeDiscount(items.reduce((s, i) => s + i.lineCents, 0), pct);
  return productCodeDiscount(items, await percentByProductForCode(code));
};
