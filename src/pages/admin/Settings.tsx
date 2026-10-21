import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import Skeleton from "@/components/Skeleton";
import { useSettings } from "@/lib/store";
import { api, post } from "@/lib/api";
import { useTitle } from "@/lib/title";
import { refreshAdmin, Msg } from "./hooks";
export default function Settings() {
  useTitle("Settings", true);
  const [sp, setSp] = useSearchParams(); const { settings: s, loading } = useSettings(); const [busy, setBusy] = useState("");
  if (loading) return <Skeleton />;
  const cls = "w-full rounded-xl border border-sky-border bg-white px-4 py-3";
  const run = (name: string, send: (f: FormData) => Promise<Response>, after?: () => void) => async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (busy) return; setBusy(name); const form = e.currentTarget;
    try { const j = await (await send(new FormData(form))).json().catch(() => ({})) as { ok?: boolean; error?: string };  refreshAdmin(); if (j.ok) { form.reset(); after?.(); } setSp(j.ok ? { saved: "1" } : { error: j.error ?? "Could not save. Please try again." }); window.scrollTo({ top: 0 }); }
    catch { setSp({ error: "Could not reach the server. Please try again." }); } finally { setBusy(""); }
  };
  const multi = (path: string) => (f: FormData) => api(path, { method: "POST", body: f });
  const json = (f: FormData) => post("/admin/settings", { pp: f.get("pp"), prov: f.get("prov"), tg: f.get("tg"), fb: f.get("fb") });
  return (<div className="max-w-xl space-y-6"><h1 className="text-3xl font-extrabold">Store settings</h1>
    <Msg ok={sp.get("saved") ? "Saved" : null} err={sp.get("error")} />
    <form onSubmit={run("logo", multi("/admin/settings/logo"))} className="space-y-3 rounded-xl2 border border-sky-border bg-white p-4"><p className="font-semibold">Shop logo</p>
      <p className="text-sm text-mute">Shown in the shop header, footer and admin. JPG, PNG or WebP, max 5 MB. A PNG with a transparent background looks best.</p>
      <img src={s.logoUrl} alt="Current logo" className="h-20 w-auto rounded-xl border border-sky-border bg-page p-1" />
      <input name="logo" type="file" accept="image/png,image/jpeg,image/webp" className={cls} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="reset" /> Reset to the default logo (ignores the file above)</label>
      <button disabled={!!busy} className="min-h-11 rounded-full bg-sky px-8 font-bold hover:bg-sky-hover disabled:opacity-50">{busy === "logo" ? "Saving…" : "Update logo"}</button></form>
    <form onSubmit={run("banners", multi("/admin/settings/banners"))} className="space-y-3 rounded-xl2 border border-sky-border bg-white p-4"><p className="font-semibold">Home page banners</p>
      <p className="text-sm text-mute">Shown above &quot;Featured toys&quot; and change every 2 seconds. Up to 6 images (JPG, PNG, WebP, max 5 MB each). Best size: wide, about 1600 × 600.</p>
      {(s.banners ?? []).length > 0 && <div className="flex flex-wrap gap-3">{s.banners.map((b) => <label key={b} className="w-40 text-center text-xs"><img src={b} alt="Banner" className="h-20 w-40 rounded-lg border border-sky-border object-cover" /><input type="checkbox" name="keep" value={b} defaultChecked /> keep (untick to delete)</label>)}</div>}
      <input name="banners" type="file" multiple accept="image/png,image/jpeg,image/webp" className={cls} />
      <button disabled={!!busy} className="min-h-11 rounded-full bg-sky px-8 font-bold hover:bg-sky-hover disabled:opacity-50">{busy === "banners" ? "Saving…" : "Save banners"}</button></form>
    <form key={`${s.shipPhnomPenhCents}-${s.shipProvinceCents}-${s.telegramUrl}-${s.facebookUrl}`} onSubmit={run("store", json)} className="space-y-3">
    <label className="block">Delivery fee, Phnom Penh (USD)<input name="pp" type="number" step="0.01" min="0" defaultValue={(s.shipPhnomPenhCents / 100).toFixed(2)} className={cls} /></label>
    <label className="block">Delivery fee, Province (USD)<input name="prov" type="number" step="0.01" min="0" defaultValue={(s.shipProvinceCents / 100).toFixed(2)} className={cls} /></label>
    <label className="block">Telegram link (https://…)<input name="tg" defaultValue={s.telegramUrl} className={cls} /></label>
    <label className="block">Facebook page link (https://…)<input name="fb" defaultValue={s.facebookUrl} className={cls} /></label>
    <div className="rounded-xl2 border border-sky-border bg-white p-4"><p className="font-semibold">Payment QR (ABA PAY)</p><p className="text-sm text-mute">Loaded from <code>public/img/qr-pay.png</code>. To change it, replace that file and redeploy.</p>
      <img src="/img/qr-pay.png" alt="Current payment QR" className="mt-2 w-48 rounded-xl border border-sky-border" /></div>
    <button disabled={!!busy} className="min-h-11 rounded-full bg-sky px-8 font-bold hover:bg-sky-hover disabled:opacity-50">{busy === "store" ? "Saving…" : "Save settings"}</button></form></div>);
}
