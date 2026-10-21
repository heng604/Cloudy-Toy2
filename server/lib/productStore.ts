// Products in Supabase (table public.products) + images in Supabase Storage (bucket "product-images").
// Permanent: products only disappear when an admin deletes them. No automatic re-seeding.
import { db, must } from "./db";
import { toProduct, slugify, type Product, type ProductRow } from "../../shared/products";
export { stockStatus, LOW_STOCK, categoriesOf } from "../../shared/products";
const BUCKET = "product-images";
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/** Every product, including hidden ones. Admin only. */
export async function listAllProducts(): Promise<Product[]> { return (must(await db().from("products").select("*").order("created_at", { ascending: true })) as ProductRow[]).map(toProduct); }
/** Storefront view (used by checkout): hidden products are never returned. Always fresh so stock checks are correct. */
export async function listProducts(): Promise<Product[]> { return (must(await db().from("products").select("*").eq("active", true).order("created_at", { ascending: false })) as ProductRow[]).map(toProduct); }
export async function getProductById(id: string) { if (!isUuid(id)) return null; const r = must(await db().from("products").select("*").eq("id", id).maybeSingle()) as ProductRow | null; return r ? toProduct(r) : null; }

export async function upsertProduct(p: Omit<Product, "id" | "slug"> & { id?: string }) {
  const fields = { name: p.name, sku: p.sku, category: p.category, description: p.description, price: p.price, stock: p.stock, images: p.images, active: p.active !== false, updated_at: new Date().toISOString() };
  if (p.id) { must(await db().from("products").update(fields).eq("id", p.id).select("id").single()); return p.id; }
  const base = slugify(p.name);
  const taken = new Set((must(await db().from("products").select("slug").like("slug", `${base}%`)) as { slug: string }[]).map((x) => x.slug));
  let slug = base, n = 2; while (taken.has(slug)) slug = `${base}-${n++}`;
  return (must(await db().from("products").insert({ ...fields, slug }).select("id").single()) as { id: string }).id;
}
export async function skuTaken(sku: string, exceptId?: string) {
  const rows = must(await db().from("products").select("id").ilike("sku", sku.replace(/[\\%_]/g, "\\$&"))) as { id: string }[];
  return rows.some((r) => r.id !== exceptId);
}
export async function deleteProduct(id: string) {
  const p = await getProductById(id); if (!p) return;
  must(await db().from("products").delete().eq("id", id).select("id"));
  await deleteProductImages(p.images.map((i) => i.src));
}
export async function setStock(id: string, stock: number) { if (!isUuid(id)) return; must(await db().from("products").update({ stock: Math.max(0, Math.floor(stock)), updated_at: new Date().toISOString() }).eq("id", id).select("id")); }
/** Atomic: throws INSUFFICIENT_STOCK (and changes nothing) if any line exceeds current stock. */
export async function decrementStock(items: { productId: string; qty: number }[]) {
  const r = await db().rpc("decrement_stock", { items });
  if (r.error) throw new Error(r.error.message.includes("INSUFFICIENT_STOCK") ? "INSUFFICIENT_STOCK" : r.error.message);
}
/** Undo a decrement (used only if saving the order fails afterwards). */
export async function restoreStock(items: { productId: string; qty: number }[]) { must(await db().rpc("restore_stock", { items })); }

/** Upload a validated image; returns its permanent public URL. */
export async function uploadProductImage(name: string, bytes: Uint8Array, mime: string) {
  const s = db().storage.from(BUCKET); const r = await s.upload(name, bytes, { contentType: mime, upsert: false, cacheControl: "31536000" });
  if (r.error) throw new Error(r.error.message);
  return s.getPublicUrl(name).data.publicUrl;
}
export async function deleteProductImages(srcs: string[]) {
  const names = srcs.map((s) => s.split("/").pop() ?? "").filter((n) => /^[a-z0-9-]+\.(jpg|png|webp)$/.test(n));
  if (names.length) await db().storage.from(BUCKET).remove(names).catch(() => undefined);
}
