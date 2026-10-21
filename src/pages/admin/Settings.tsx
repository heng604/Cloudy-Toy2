import { useI18n } from "@/lib/i18n";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import Skeleton from "@/components/Skeleton";
import { useSettings } from "@/lib/store";
import { api, post } from "@/lib/api";
import { compressFormData } from "@/lib/compress";
import { useTitle } from "@/lib/title";
import { refreshAdmin, Msg } from "./hooks";
export default function Settings() {
  const { t } = useI18n(); useTitle(t("Settings"), true);
  const [sp, setSp] = useSearchParams(); const { settings: s, loading } = useSettings(); const [busy, setBusy] = useState("");
  if (loading) return <Skeleton />;
  const cls = "w-full rounded-xl border border-sky-border bg-white px-4 py-3";
  const run = (name: string, send: (f: FormData) => Promise<Response>, after?: () => void) => async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (busy) return; setBusy(name); const form = e.currentTarget;
    try { const j = await (await send(new FormData(form))).json().catch(() => ({})) as { ok?: boolean; error?: string };  refreshAdmin(); if (j.ok) { form.reset(); after?.(); } setSp(j.ok ? { saved: "1" } : { error: j.error ?? "Could not save. Please try again." }); window.scrollTo({ top: 0 }); }
    catch { setSp({ error: "Could not reach the server. Please try again." }); } finally { setBusy(""); }
  };
  const del = async (name: string, msg: string, send: () => Promise<Response>) => {
    if (busy || !confirm(msg)) return; setBusy(name);
    try { const j = await (await send()).json().catch(() => ({})) as { ok?: boolean; error?: string }; refreshAdmin(); setSp(j.ok ? { saved: "1" } : { error: j.error ?? "Could not delete. Please try again." }); window.scrollTo({ top: 0 }); }
    catch { setSp({ error: "Could not reach the server. Please try again." }); } finally { setBusy(""); }
  };
  const reset = () => { const f = new FormData(); f.set("reset", "on"); return f; };
  const btnDel = "rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50";
  const multi = (path: string) => async (f: FormData) => api(path, { method: "POST", body: await compressFormData(f) });
  const json = (f: FormData) => post("/admin/settings", { pp: f.get("pp"), prov: f.get("prov"), tg: f.get("tg"), fb: f.get("fb") });
  return (<div className="max-w-xl space-y-6"><h1 className="text-2xl font-extrabold sm:text-3xl">{t("Store settings")}</h1>
    <Msg ok={sp.get("saved") ? "Saved" : null} err={sp.get("error")} />
    <form onSubmit={run("logo", multi("/admin/settings/logo"))} className="space-y-3 rounded-xl2 border border-sky-border bg-white p-4"><p className="font-semibold">Shop logo</p>
      <p className="text-sm text-mute">Shown in the shop header, footer and admin. JPG, PNG or WebP, max 5 MB. A PNG with a transparent background looks best.</p>
      <img src={s.logoUrl} alt="Current logo" className="h-20 w-auto rounded-xl border border-sky-border bg-page p-1" />
      <input name="logo" type="file" accept="image/png,image/jpeg,image/webp" className={cls} />
      <div className="flex flex-wrap gap-2"><button disabled={!!busy} className="min-h-11 rounded-full bg-sky px-8 font-bold hover:bg-sky-hover disabled:opacity-50">{busy === "logo" ? "Saving…" : "Update logo"}</button>
      {s.logoUrl !== "/img/logo.png" && <button type="button" disabled={!!busy} onClick={() => del("logo", "Delete this logo and go back to the default logo?", async () => api("/admin/settings/logo", { method: "POST", body: reset() }))} className={btnDel}>Delete logo</button>}</div></form>
    <form onSubmit={run("banners", multi("/admin/settings/banners"))} className="space-y-3 rounded-xl2 border border-sky-border bg-white p-4"><p className="font-semibold">Home page banners</p>
      <p className="text-sm text-mute">Shown above &quot;Featured toys&quot; and change every 2 seconds. Up to 6 images (JPG, PNG, WebP, max 5 MB each). Best size: wide, about 1600 × 600.</p>
      {(s.banners ?? []).length > 0 && <div className="flex flex-wrap gap-3">{s.banners.map((b) => <div key={b} className="w-40 space-y-1 text-center"><img src={b} alt="Banner" className="h-20 w-40 rounded-lg border border-sky-border object-cover" /><input type="hidden" name="keep" value={b} /><button type="button" disabled={!!busy} onClick={() => del("banner", "Delete this banner image?", () => post("/admin/settings/banners/delete", { url: b }))} className={btnDel + " w-full"}>Delete</button></div>)}</div>}
      <input name="banners" type="file" multiple accept="image/png,image/jpeg,image/webp" className={cls} />
      <button disabled={!!busy} className="min-h-11 rounded-full bg-sky px-8 font-bold hover:bg-sky-hover disabled:opacity-50">{busy === "banners" ? "Saving…" : "Save banners"}</button></form>
    <form onSubmit={run("qr", multi("/admin/settings/qr"))} className="space-y-3 rounded-xl2 border border-sky-border bg-white p-4"><p className="font-semibold">Payment QR (ABA PAY)</p>
      <p className="text-sm text-mute">Shown to customers at checkout. JPG, PNG or WebP, max 5 MB.</p>
      <img src={s.qrUrl || "/img/qr-pay.png"} alt="Current payment QR" className="w-48 rounded-xl border border-sky-border" />
      <input name="qr" type="file" accept="image/png,image/jpeg,image/webp" className={cls} />
      <div className="flex flex-wrap gap-2"><button disabled={!!busy} className="min-h-11 rounded-full bg-sky px-8 font-bold hover:bg-sky-hover disabled:opacity-50">{busy === "qr" ? "Saving…" : "Update QR"}</button>
      {s.qrUrl && s.qrUrl !== "/img/qr-pay.png" && <button type="button" disabled={!!busy} onClick={() => del("qr", "Delete this QR image and go back to the built-in QR?", async () => api("/admin/settings/qr", { method: "POST", body: reset() }))} className={btnDel}>Delete QR</button>}</div></form>
    <form key={`${s.shipPhnomPenhCents}-${s.shipProvinceCents}-${s.telegramUrl}-${s.facebookUrl}`} onSubmit={run("store", json)} className="space-y-3">
    <label className="block">Delivery fee, Phnom Penh (USD)<input name="pp" type="number" step="0.01" min="0" defaultValue={(s.shipPhnomPenhCents / 100).toFixed(2)} className={cls} /></label>
    <label className="block">Delivery fee, Province (USD)<input name="prov" type="number" step="0.01" min="0" defaultValue={(s.shipProvinceCents / 100).toFixed(2)} className={cls} /></label>
    <label className="block">Telegram link (https://…)<input name="tg" defaultValue={s.telegramUrl} className={cls} /></label>
    <label className="block">Facebook page link (https://…)<input name="fb" defaultValue={s.facebookUrl} className={cls} /></label>
    <button disabled={!!busy} className="min-h-11 rounded-full bg-sky px-8 font-bold hover:bg-sky-hover disabled:opacity-50">{busy === "store" ? "Saving…" : "Save settings"}</button></form></div>);
}
