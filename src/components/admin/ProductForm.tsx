import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "@shared/products";
import { api } from "@/lib/api";
import FilePicker from "./FilePicker";
import { compressFormData } from "@/lib/compress";
const cls = "w-full rounded-xl border border-sky-border bg-white px-4 py-3";
export default function ProductForm({ p, error: initialError, categories }: { p?: Product; error?: string; categories: string[] }) {
  const navigate = useNavigate(); const [busy, setBusy] = useState(false); const [error, setError] = useState(initialError);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy) return; setBusy(true); setError(undefined);
    try {
      const r = await api("/admin/products/save", { method: "POST", body: await compressFormData(new FormData(e.currentTarget)) });
      if (r.status === 413) { setError("Images are too large. Try fewer or smaller photos."); window.scrollTo({ top: 0 }); return; }
      const j = await r.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (j.ok) { navigate("/admin/products?saved=1"); return; }
      setError(j.error ?? "Could not save. Please try again."); window.scrollTo({ top: 0 });
    } catch { setError("Could not reach the server. Please try again."); } finally { setBusy(false); }
  }
  return (<form onSubmit={submit} className="w-full max-w-3xl space-y-3 rounded-xl2 border border-sky-border bg-white p-4 sm:p-6">
    {p && <input type="hidden" name="id" value={p.id} />}
    {error && <p role="alert" className="rounded-xl bg-red-100 p-3 text-red-800">{error}</p>}
    <label className="block">Name<input name="name" required minLength={2} defaultValue={p?.name} className={cls} /></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="block">SKU<input name="sku" required minLength={2} maxLength={40} pattern="[A-Za-z0-9_#*\-]+" title="Letters, numbers and # * _ - only (no spaces)" autoCapitalize="characters" autoComplete="off" placeholder="e.g. CT-TOY-001, #A1, BEAR*2" defaultValue={p?.sku} className={`${cls} font-mono`} /><span className="mt-1 block text-xs text-mute">Letters, numbers and # * _ - allowed. No spaces.</span></label>
      <label className="block">Category<input name="category" required list="cats" defaultValue={p?.category} className={cls} /><datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></label></div>
    <div className="grid gap-3 sm:grid-cols-2"><label className="block">Price (USD)<input name="price" type="number" step="0.01" min="0" required defaultValue={p?.price} className={cls} /></label>
      <label className="block">Stock<input name="stock" type="number" step="1" min="0" required defaultValue={p?.stock ?? 0} className={cls} /></label></div>
    <label className="block">Description<textarea name="description" rows={4} defaultValue={p?.description} className={cls} /></label>
    <fieldset><legend className="font-semibold">Images (JPG, PNG, WebP, max 5 MB each, up to 6)</legend>
      {p && p.images.length > 0 && <div className="my-2 flex flex-wrap gap-3">{p.images.map((i) => <label key={i.src} className="w-28 text-center text-xs"><img src={i.src} alt={i.alt} className="h-24 w-28 rounded-lg border border-sky-border object-cover" /><input type="checkbox" name="keep" value={i.src} defaultChecked /> keep</label>)}</div>}
      <FilePicker name="images" multiple /></fieldset>
    <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={p ? p.active !== false : true} /> Visible in the shop</label>
    <button disabled={busy} className="min-h-11 rounded-full bg-sky px-8 font-bold hover:bg-sky-hover disabled:opacity-50">{busy ? "Saving…" : p ? "Save changes" : "Create product"}</button></form>);
}
