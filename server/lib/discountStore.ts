// Discount codes in Supabase (table public.store_discounts). Server-only; created by the admin.
// A code takes 10-50% off the cart SUBTOTAL. There are no per-item discounts.
import { db, must } from "./db";
import { cached, invalidate } from "./cache";
import { listCodeUses } from "./store";
import { subtotalCodeDiscount, type DiscountResult } from "../../shared/discount";
export type StoreDiscount = { code: string; percent: number; createdAt: string; maxUses: number | null; perCustomer: number | null; used: number };
type Row = { code: string; percent: number | string; created_at: string; max_uses: number | null; per_customer: number | null };
export async function listStoreDiscounts(): Promise<StoreDiscount[]> {
  const rows = must(await db().from("store_discounts").select("code,percent,created_at,max_uses,per_customer").order("created_at", { ascending: true })) as Row[];
  const uses = await listCodeUses().catch(() => []); const n = new Map<string, number>(); for (const u of uses) n.set(u.code, (n.get(u.code) ?? 0) + 1);
  return rows.map((r) => ({ code: r.code, percent: Number(r.percent), createdAt: r.created_at, maxUses: r.max_uses, perCustomer: r.per_customer, used: n.get(r.code) ?? 0 }));
}
type Info = { percent: number; maxUses: number | null; perCustomer: number | null };
const readInfo = async (code: string): Promise<Info | null> => {
  const r = must(await db().from("store_discounts").select("percent,max_uses,per_customer").eq("code", code).maybeSingle()) as { percent: number | string; max_uses: number | null; per_customer: number | null } | null;
  return r ? { percent: Number(r.percent), maxUses: r.max_uses, perCustomer: r.per_customer } : null;
};
/** Reads one code. Cached 10 s per code (cleared on every create / update / delete), so repeated "Apply" clicks do not hit the database. */
const getInfo = (code: string, fresh = false): Promise<Info | null> => fresh ? readInfo(code) : cached(`discount:${code}`, 10_000, async () => (await readInfo(code)) ?? ({ percent: -1 } as Info)).then((v) => (v.percent < 0 ? null : v));
/** Returns false when the code already exists. */
export async function createStoreDiscount(code: string, percent: number, maxUses: number | null = null, perCustomer: number | null = null): Promise<boolean> {
  if ((await getInfo(code, true)) !== null) return false;
  must(await db().from("store_discounts").insert({ code, percent, max_uses: maxUses, per_customer: perCustomer }).select("code")); invalidate("discount:"); return true;
}
/** Change the % and / or the use limits of an existing code. Returns false when the code does not exist. */
export async function updateStoreDiscount(code: string, patch: { percent?: number; maxUses?: number | null; perCustomer?: number | null }): Promise<boolean> {
  const row: Record<string, unknown> = {}; if (patch.percent !== undefined) row.percent = patch.percent; if (patch.maxUses !== undefined) row.max_uses = patch.maxUses; if (patch.perCustomer !== undefined) row.per_customer = patch.perCustomer;
  const rows = must(await db().from("store_discounts").update(row).eq("code", code).select("code")) as unknown[];
  invalidate("discount:"); return rows.length > 0;
}
export async function deleteStoreDiscount(code: string) { must(await db().from("store_discounts").delete().eq("code", code).select("code")); invalidate("discount:"); }
/** What a typed code is worth: its % off the whole cart subtotal. Unknown code = no discount. A code that has reached its total limit, or the customer's own limit, is refused. */
export const resolveDiscount = async (code: string, items: { lineCents: number }[], fresh = false, email?: string): Promise<DiscountResult> => { // fresh=true at real checkout (never trust a cached code when money is charged)
  const info = await getInfo(code, fresh);
  if (!info) return { ok: false, error: "That discount code is not valid." };
  if (info.maxUses !== null || info.perCustomer !== null) {
    const uses = (await listCodeUses()).filter((u) => u.code === code);
    if (info.maxUses !== null && uses.length >= info.maxUses) return { ok: false, error: "This discount code has reached its use limit." };
    if (info.perCustomer !== null) { if (!email) return { ok: false, error: "Please sign in to use this discount code." }; if (uses.filter((u) => u.email === email.toLowerCase()).length >= info.perCustomer) return { ok: false, error: "You have already used this code the most times allowed." }; }
  }
  return subtotalCodeDiscount(items.reduce((s, i) => s + i.lineCents, 0), info.percent);
};
