import { useI18n } from "@/lib/i18n";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import DeleteButton from "@/components/admin/DeleteButton";
import Skeleton from "@/components/Skeleton";
import { post } from "@/lib/api";
import { useTitle } from "@/lib/title";
import { MIN_PERCENT, MAX_PERCENT, generateCode } from "@shared/discount";
import { useAdmin, refreshAdmin, Msg } from "./hooks";
type Data = { codes: { code: string; percent: number; createdAt?: string }[] };
const PRESETS = [10, 20, 30, 40, 50];
export default function Discounts() {
  const { t } = useI18n(); useTitle(t("Discounts"), true);
  const [sp, setSp] = useSearchParams(); const { data } = useAdmin<Data>("/admin/discounts"); const [busy, setBusy] = useState(false);
  const [code, setCode] = useState(""); const [percent, setPercent] = useState(10);
  if (!data) return <Skeleton />;
  const cls = "w-full rounded-xl border border-sky-border bg-white px-4 py-3";
  const done = async (r: Response, ok: string) => { const j = await r.json().catch(() => ({})) as { ok?: boolean; error?: string }; refreshAdmin(); setSp(j.ok ? { saved: ok } : { error: j.error ?? "Could not save. Please try again." }); window.scrollTo({ top: 0 }); return !!j.ok; };
  const create = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (busy) return; setBusy(true);
    try { if (await done(await post("/admin/discounts/create", { code, percent }), `Code ${code.trim().toUpperCase()} created`)) setCode(""); }
    catch { setSp({ error: "Could not reach the server. Please try again." }); } finally { setBusy(false); }
  };
  const setPct = async (c: string, pct: number) => { try { await done(await post("/admin/discounts/update", { code: c, percent: pct }), `Code ${c} is now ${pct}% off`); } catch { setSp({ error: "Could not reach the server. Please try again." }); } };
  return (<div className="max-w-3xl space-y-6"><h1 className="text-2xl font-extrabold sm:text-3xl">{t("Discount codes")}</h1>
    <Msg ok={sp.get("saved")} err={sp.get("error")} />
    <section className="space-y-4 rounded-xl2 border border-sky-border bg-white p-4 sm:p-5"><h2 className="text-xl font-extrabold">{t("Create a code")}</h2>
      <p className="text-sm text-mute">{t("Make a code worth 10% to 50% off the cart subtotal and give it to your customers. They type it at checkout. Delivery is never discounted. There are no discounts on single items.")}</p>
      <form onSubmit={create} className="space-y-3">
        <label className="block text-sm font-semibold">{t("Code")}
          <span className="mt-1 flex gap-2"><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} required minLength={3} maxLength={30} autoComplete="off" placeholder="e.g. SAVE10" className={`${cls} font-mono font-normal uppercase`} />
            <button type="button" onClick={() => setCode(generateCode())} className="shrink-0 rounded-full border border-sky-border bg-white px-4 font-bold hover:bg-sky-pale">{t("Generate")}</button></span>
          <span className="mt-1 block text-xs font-normal text-mute">{t("3 to 30 letters, numbers, - or _")}</span></label>
        <div><p className="text-sm font-semibold">{t("Discount % (off the subtotal)")}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">{PRESETS.map((n) => <button key={n} type="button" aria-pressed={percent === n} onClick={() => setPercent(n)} className={`min-h-11 min-w-14 rounded-full border px-4 font-bold ${percent === n ? "border-sky bg-sky" : "border-sky-border bg-white hover:bg-sky-pale"}`}>{n}%</button>)}
            <input type="number" aria-label="Discount percent" value={percent} onChange={(e) => setPercent(Number(e.target.value))} required step={1} min={MIN_PERCENT} max={MAX_PERCENT} className="w-24 rounded-xl border border-sky-border bg-white px-3 py-2.5" /></div></div>
        <button disabled={busy} className="min-h-11 w-full rounded-full bg-sky px-8 font-bold hover:bg-sky-hover disabled:opacity-50 sm:w-auto">{busy ? t("Saving…") : t("Create code")}</button></form></section>
    <section className="space-y-3 rounded-xl2 border border-sky-border bg-white p-4 sm:p-5"><h2 className="text-xl font-extrabold">{t("Your codes ({n})", { n: data.codes.length })}</h2>
      {data.codes.length === 0 ? <p className="rounded-xl border border-dashed border-sky-border p-4 text-center text-sm text-mute">{t("No codes yet. Create one above.")}</p>
        : <ul className="grid gap-3 md:grid-cols-2">{data.codes.map((c) => <li key={c.code} className="space-y-3 rounded-xl border border-sky-border bg-sky-pale p-3">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-all font-mono text-lg font-extrabold">{c.code}</p><p className="text-sm text-mute">{t("{n}% off the subtotal", { n: c.percent })}</p></div>
            <DeleteButton action={async () => { await done(await post("/admin/discounts/delete", { code: c.code }), `Code ${c.code} deleted`); }} message={`Delete the code ${c.code}? Customers will no longer be able to use it.`} /></div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Change percent for ${c.code}`}>{PRESETS.map((n) => <button key={n} type="button" disabled={n === c.percent} onClick={() => setPct(c.code, n)} className={`rounded-full px-3 py-1 text-xs font-bold ${n === c.percent ? "bg-sky" : "border border-sky-border bg-white hover:bg-sky-pale"}`}>{n}%</button>)}</div></li>)}</ul>}</section></div>);
}
