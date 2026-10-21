import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "@shared/products";
import type { ProductDiscount } from "@shared/types";
import { api } from "@/lib/api";
const cls = "w-full rounded-xl border border-sky-border bg-white px-4 py-3";
export default function ProductForm({ p, error: initialError, categories, discount }: { p?: Product; error?: string; categories: string[]; discount?: ProductDiscount | null }) {
  const navigate = useNavigate(); const [busy, setBusy] = useState(false); const [error, setError] = useState(initialError);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy) return; setBusy(true); setError(undefined);
    try {
      const r = await api("/admin/products/save", { method: "POST", body: new FormData(e.currentTarget) });
      const j = await r.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (j.ok) { navigate("/admin/products?saved=1"); return; }
      setError(j.error ?? "Could not save. Please try again."); window.scrollTo({ top: 0 });
    } catch { setError("Could not reach the server. Please try again."); } finally { setBusy(false); }
  }
  return (<form onSubmit={submit} className="max-w-2xl space-y-3 rounded-xl2 border border-sky-border bg-white p-6">
    {p && <input type="hidden" name="id" value={p.id} />}
    {error && <p role="alert" className="rounded-xl bg-red-100 p-3 text-red-800">{error}</p>}
    <label className="block">Name<input name="name" required minLength={2} defaultValue={p?.name} className={cls} /></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="block">SKU<input name="sku" required defaultValue={p?.sku} className={cls} /></label>
      <label className="block">Category<input name="category" required list="cats" defaultValue={p?.category} className={cls} /><datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></label></div>
    <div className="grid gap-3 sm:grid-cols-3"><label className="block">Price (USD)<input name="price" type="number" step="0.01" min="0" required defaultValue={p?.price} className={cls} /></label>
      <label className="block">Stock<input name="stock" type="number" step="1" min="0" required defaultValue={p?.stock ?? 0} className={cls} /></label></div>
    <fieldset className="rounded-xl border border-sky-border p-3"><legend className="px-1 font-semibold">Discount for this product (optional)</legend>
      <div className="grid gap-3 sm:grid-cols-2"><label className="block">Discount %<input name="discountPercent" type="number" step="1" min="10" max="50" placeholder="10 to 50" defaultValue={discount?.percent} className={cls} /></label>
        <label className="block">Discount code<input name="discountCode" maxLength={30} placeholder="e.g. TOY10" defaultValue={discount?.code} className={`${cls} font-mono uppercase`} /></label></div>
      <p className="mt-2 text-sm text-mute">Discount can be 10% to 50%. Customers get this % off only when they type this exact code at checkout. Without the code they pay the full price. Leave both empty for no discount.</p></fieldset>
    <label className="block">Description<textarea name="description" rows={4} defaultValue={p?.description} className={cls} /></label>
    <fieldset><legend className="font-semibold">Images (JPG, PNG, WebP, max 5 MB each, up to 6)</legend>
      {p && p.images.length > 0 && <div className="my-2 flex flex-wrap gap-3">{p.images.map((i) => <label key={i.src} className="w-28 text-center text-xs"><img src={i.src} alt={i.alt} className="h-24 w-28 rounded-lg border border-sky-border object-cover" /><input type="checkbox" name="keep" value={i.src} defaultChecked /> keep</label>)}</div>}
      <input name="images" type="file" multiple accept="image/png,image/jpeg,image/webp" className={cls} /></fieldset>
    <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={p ? p.active !== false : true} /> Visible in the shop</label>
    <button disabled={busy} className="min-h-11 rounded-full bg-sky px-8 font-bold hover:bg-sky-hover disabled:opacity-50">{busy ? "Saving…" : p ? "Save changes" : "Create product"}</button></form>);
}
