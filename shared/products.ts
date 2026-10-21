export type Product = { id: string; slug: string; name: string; sku: string; price: number; salePrice?: number; stock: number; category: string; description: string; images: { src: string; alt: string }[]; active?: boolean; createdAt?: string };
export const FALLBACK_IMG = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='#EAF5FF'/><path d='M110 190a40 40 0 0 1 12-78 55 55 0 0 1 106-8 45 45 0 0 1 58 86z' fill='#8ECCFF'/></svg>");
export const money = (n: number) => `$${n.toFixed(2)}`;
/** A product counts as "New" for 14 days after the admin adds it. */
export const NEW_DAYS = 14;
export const isNewProduct = (createdAt?: string, now = Date.now()) => !!createdAt && now - new Date(createdAt).getTime() < NEW_DAYS * 86400000;
export const LOW_STOCK = 5;
export const stockStatus = (stock: number): "OUT" | "LOW" | "OK" => (stock <= 0 ? "OUT" : stock <= LOW_STOCK ? "LOW" : "OK");
export const categoriesOf = (list: Product[]) => [...new Set(list.map((p) => p.category).filter(Boolean))].sort();
export function slugify(s: string) { return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "product"; }
/** Row shape of public.products and its mapping to Product (used by both the browser and the server). */
export type ProductRow = { id: string; slug: string; name: string; sku: string; price: number | string; sale_price: number | string | null; stock: number; created_at: string; category: string | null; description: string | null; images: { src: string; alt: string }[] | null; active: boolean };
export const toProduct = (r: ProductRow): Product => ({ id: r.id, slug: r.slug, name: r.name, sku: r.sku, price: Number(r.price), stock: r.stock, category: r.category ?? "", createdAt: r.created_at, description: r.description ?? "", images: r.images ?? [], active: r.active });
