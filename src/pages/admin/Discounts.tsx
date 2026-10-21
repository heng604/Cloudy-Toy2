import { useState, type FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
import DeleteButton from "@/components/admin/DeleteButton";
import Skeleton from "@/components/Skeleton";
import { post } from "@/lib/api";
import { useTitle } from "@/lib/title";
import { MIN_PERCENT, MAX_PERCENT } from "@shared/discount";
import { useAdmin, refreshAdmin, Msg } from "./hooks";
type Data = { codes: { code: string; percent: number }[]; products: { productId: string; code: string; percent: number; name: string; sku: string }[] };
export default function Discounts() {
  useTitle("Discounts", true);
  const [sp, setSp] = useSearchParams(); const { data } = useAdmin<Data>("/admin/discounts"); const [busy, setBusy] = useState(false);
  if (!data) return <Skeleton />;
  const cls = "w-full rounded-xl border border-sky-border bg-white px-4 py-3";
  const done = async (r: Response, ok: string) => { const j = await r.json().catch(() => ({})) as { ok?: boolean; error?: string }; refreshAdmin(); setSp(j.ok ? { saved: ok } : { error: j.error ?? "Could not save. Please try again." }); window.scrollTo({ top: 0 }); return !!j.ok; };
  const create = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (busy) return; setBusy(true); const form = e.currentTarget; const f = new FormData(form);
    try { if (await done(await post("/admin/discounts/create", { code: f.get("code"), percent: Number(f.get("percent")) }), "Discount code created")) form.reset(); }
    catch { setSp({ error: "Could not reach the server. Please try again." }); } finally { setBusy(false); }
  };
  return (<div className="max-w-3xl space-y-6"><h1 className="text-3xl font-extrabold">Discounts</h1>
    <Msg ok={sp.get("saved")} err={sp.get("error")} />
    <section className="space-y-3 rounded-xl2 border border-sky-border bg-white p-4"><h2 className="text-xl font-extrabold">Discount codes (% off the subtotal)</h2>
      <p className="text-sm text-mute">Create a code worth {MIN_PERCENT}% to {MAX_PERCENT}% off the cart subtotal. Customers type it at checkout. Delivery is never discounted.</p>
      <form onSubmit={create} className="grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
        <label className="block text-sm font-semibold">Code<input name="code" required maxLength={30} placeholder="e.g. SAVE10" className={`${cls} font-mono font-normal uppercase`} /></label>
        <label className="block text-sm font-semibold">Discount %<input name="percent" type="number" required step="1" min={MIN_PERCENT} max={MAX_PERCENT} placeholder="10 to 50" className={`${cls} font-normal`} /></label>
        <button disabled={busy} className="min-h-11 rounded-full bg-sky px-8 font-bold hover:bg-sky-hover disabled:opacity-50">{busy ? "Saving…" : "Add code"}</button></form>
      {data.codes.length === 0 ? <p className="rounded-xl border border-dashed border-sky-border p-4 text-center text-sm text-mute">No codes yet. Add one above.</p>
        : <ul className="grid gap-3 sm:grid-cols-2">{data.codes.map((c) => <li key={c.code} className="flex items-center justify-between gap-3 rounded-xl border border-sky-border bg-sky-pale p-3">
          <div><p className="font-mono text-lg font-extrabold">{c.code}</p><p className="text-sm text-mute">{c.percent}% off subtotal</p></div>
          <DeleteButton action={async () => { await done(await post("/admin/discounts/delete", { code: c.code }), `Code ${c.code} deleted`); }} message={`Delete the code ${c.code}? Customers will no longer be able to use it.`} /></li>)}</ul>}</section>
    <section className="space-y-3 rounded-xl2 border border-sky-border bg-white p-4"><h2 className="text-xl font-extrabold">Discounts on items</h2>
      <p className="text-sm text-mute">Item discounts are set in the product form (<Link to="/admin/products" className="underline">Products</Link>). Delete them here one by one.</p>
      {data.products.length === 0 ? <p className="rounded-xl border border-dashed border-sky-border p-4 text-center text-sm text-mute">No item discounts.</p>
        : <ul className="space-y-2">{data.products.map((p) => <li key={p.productId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-border p-3">
          <div><p className="font-semibold">{p.name} <span className="text-xs font-normal text-mute">{p.sku}</span></p><p className="text-sm text-mute"><span className="font-mono font-bold">{p.code}</span> · {p.percent}% off this item</p></div>
          <DeleteButton action={async () => { await done(await post("/admin/discounts/product/delete", { productId: p.productId }), `Discount on ${p.name} deleted`); }} message={`Delete the discount on ${p.name}?`} /></li>)}</ul>}</section></div>);
}
