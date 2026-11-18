// Points gift exchange in Supabase (tables public.gifts and public.gift_redemptions). Server-only.
import { db, must } from "./db";
import type { Gift, Redemption, RedemptionStatus } from "../../shared/gifts";
type GRow = { id: string; name: string; description: string; points: number; was_points: number | null; stock: number; image: string; active: boolean };
type RRow = { id: string; email: string; customer_name: string; gift_id: string; gift_name: string; gift_image: string; points: number; status: RedemptionStatus; created_at: string; claimed_at: string | null };
const toGift = (r: GRow): Gift => ({ id: r.id, name: r.name, description: r.description, points: r.points, wasPoints: r.was_points, stock: r.stock, image: r.image, active: r.active });
const toRed = (r: RRow): Redemption => ({ id: r.id, email: r.email, customerName: r.customer_name, giftId: r.gift_id, giftName: r.gift_name, giftImage: r.gift_image, points: r.points, status: r.status, createdAt: r.created_at, claimedAt: r.claimed_at });
const newId = () => crypto.randomUUID().slice(0, 12);
export async function listGifts(onlyActive = false): Promise<Gift[]> {
  let q = db().from("gifts").select("*").order("created_at", { ascending: true }); if (onlyActive) q = q.eq("active", true);
  return (must(await q) as GRow[]).map(toGift);
}
export async function saveGift(id: string | undefined, v: Omit<Gift, "id">): Promise<boolean> {
  const row = { name: v.name, description: v.description, points: v.points, was_points: v.wasPoints, stock: v.stock, image: v.image, active: v.active };
  if (!id) { must(await db().from("gifts").insert({ id: newId(), ...row }).select("id")); return true; }
  return (must(await db().from("gifts").update(row).eq("id", id).select("id")) as unknown[]).length > 0;
}
export async function getGift(id: string): Promise<Gift | null> { const r = must(await db().from("gifts").select("*").eq("id", id).maybeSingle()) as GRow | null; return r ? toGift(r) : null; }
export async function deleteGift(id: string) { must(await db().from("gifts").delete().eq("id", id).select("id")); }
export async function listRedemptions(email?: string): Promise<Redemption[]> {
  let q = db().from("gift_redemptions").select("*").order("created_at", { ascending: false }).limit(1000); if (email) q = q.eq("email", email.toLowerCase());
  return (must(await q) as RRow[]).map(toRed);
}
/** Points already spent (a cancelled redemption gives its points back). */
export const redeemedPoints = (list: { email: string; points: number; status: RedemptionStatus }[]) => { const m = new Map<string, number>(); for (const r of list) if (r.status !== "CANCELLED") m.set(r.email.toLowerCase(), (m.get(r.email.toLowerCase()) ?? 0) + r.points); return m; };
/** Takes one from the stock (only when some is left; the check and the change are ONE database statement, so two people can never take the last one). */
async function takeStock(gift: Gift): Promise<boolean> {
  const rows = must(await db().from("gifts").update({ stock: gift.stock - 1 }).eq("id", gift.id).eq("stock", gift.stock).gt("stock", 0).select("id")) as unknown[]; return rows.length > 0;
}
const giveStock = async (id: string) => { const g = await getGift(id); if (g) await db().from("gifts").update({ stock: g.stock + 1 }).eq("id", id).eq("stock", g.stock); };
const locks = new Map<string, Promise<unknown>>(); // one redemption at a time per customer (inside this server), so the points check cannot be raced
const serial = <T,>(key: string, fn: () => Promise<T>): Promise<T> => { const run = (locks.get(key) ?? Promise.resolve()).catch(() => {}).then(fn); locks.set(key, run); run.finally(() => { if (locks.get(key) === run) locks.delete(key); }).catch(() => {}); return run; };
/** Spends points on a gift. `earned` = points the customer has earned in total. Returns an error text or the new redemption. */
export function redeemGift(email: string, name: string, giftId: string, earned: number): Promise<{ error: string } | { ok: Redemption }> {
  const em = email.toLowerCase();
  return serial(em, async () => {
    const gift = await getGift(giftId); if (!gift || !gift.active) return { error: "This gift is not available" };
    const spent = redeemedPoints(await listRedemptions(em)).get(em) ?? 0;
    if (earned - spent < gift.points) return { error: "You do not have enough points for this gift yet" };
    if (!(await takeStock(gift))) return { error: "Sorry, this gift is out of stock" };
    try {
      const row = { id: newId(), email: em, customer_name: name.slice(0, 100), gift_id: gift.id, gift_name: gift.name, gift_image: gift.image, points: gift.points, status: "PENDING" };
      return { ok: toRed(must(await db().from("gift_redemptions").insert(row).select("*").single()) as RRow) };
    } catch (e) { await giveStock(gift.id); throw e; }
  });
}
/** Admin: mark claimed, or cancel (points go back to the customer and the gift goes back into stock). */
export async function setRedemption(id: string, status: "CLAIMED" | "CANCELLED"): Promise<boolean> {
  const cur = must(await db().from("gift_redemptions").select("*").eq("id", id).maybeSingle()) as RRow | null; if (!cur || cur.status !== "PENDING") return false;
  const rows = must(await db().from("gift_redemptions").update({ status, claimed_at: status === "CLAIMED" ? new Date().toISOString() : null }).eq("id", id).eq("status", "PENDING").select("id")) as unknown[];
  if (rows.length > 0 && status === "CANCELLED") await giveStock(cur.gift_id);
  return rows.length > 0;
}
