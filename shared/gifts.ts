// Points gift exchange (no I/O). Members spend the points they earned on gifts the admin lists on Admin > Membership.
export type Gift = { id: string; name: string; description: string; points: number; wasPoints: number | null; stock: number; image: string; active: boolean };
export type RedemptionStatus = "PENDING" | "CLAIMED" | "CANCELLED";
export type Redemption = { id: string; email: string; customerName: string; giftId: string; giftName: string; giftImage: string; points: number; status: RedemptionStatus; createdAt: string; claimedAt: string | null };
export const MAX_GIFT_POINTS = 1_000_000, MAX_GIFT_STOCK = 100_000;
type Checked<T> = { ok: true; value: T } | { ok: false; error: string };
const int = (v: unknown) => (v === "" || v === null || v === undefined ? NaN : Number(v));
/** Validates one gift typed by the admin. */
export function checkGift(i: { id?: unknown; name?: unknown; description?: unknown; points?: unknown; wasPoints?: unknown; stock?: unknown; image?: unknown; active?: unknown }): Checked<Omit<Gift, "id">> {
  const name = String(i.name ?? "").trim(), description = String(i.description ?? "").trim(), image = String(i.image ?? "").trim();
  if (name.length < 2 || name.length > 80) return { ok: false, error: "Gift name needs 2 to 80 characters" };
  if (description.length > 200) return { ok: false, error: "Description is too long (200 characters at most)" };
  const points = int(i.points); if (!Number.isInteger(points) || points < 1 || points > MAX_GIFT_POINTS) return { ok: false, error: "Points must be a whole number of 1 or more" };
  const noWas = i.wasPoints === "" || i.wasPoints === null || i.wasPoints === undefined; const was = noWas ? null : int(i.wasPoints);
  if (was !== null && (!Number.isInteger(was) || was <= points || was > MAX_GIFT_POINTS)) return { ok: false, error: "The old points must be more than the points now (or leave it empty)" };
  const stock = int(i.stock); if (!Number.isInteger(stock) || stock < 0 || stock > MAX_GIFT_STOCK) return { ok: false, error: "Stock must be a whole number (0 or more)" };
  if (image.length > 600 || (image && !/^(\/|https?:\/\/)/.test(image))) return { ok: false, error: "Gift picture is not valid" };
  return { ok: true, value: { name, description, points, wasPoints: was, stock, image, active: i.active !== false && i.active !== "false" } };
}
