import { useState, type FormEvent } from "react";
import Skeleton from "@/components/Skeleton";
import ImageUpload from "@/components/admin/ImageUpload";
import { post } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAdmin, refreshAdmin } from "./hooks";
import type { Gift, Redemption } from "@shared/gifts";
type Msg = { ok: boolean; text: string } | null;
const field = "w-full rounded-xl border border-sky-border bg-[#F3F9FE] px-3.5 py-2.5 outline-none";
const lab = "block text-sm font-bold";
const card = "rounded-3xl bg-white p-5 shadow-soft sm:p-6";
async function send(path: string, body: object, ok: string): Promise<{ ok: boolean; text: string }> {
  try { const j = await (await post(path, body)).json().catch(() => ({})) as { ok?: boolean; error?: string }; if (j.ok) { refreshAdmin(); return { ok: true, text: ok }; } return { ok: false, text: j.error ?? "Could not save. Please try again." }; }
  catch { return { ok: false, text: "Could not reach the server. Please try again." }; }
}
type Form = { id?: string; name: string; description: string; points: string; wasPoints: string; stock: string; image: string; active: boolean };
const blank = (): Form => ({ name: "", description: "", points: "", wasPoints: "", stock: "10", image: "", active: true });
const toForm = (g: Gift): Form => ({ id: g.id, name: g.name, description: g.description, points: String(g.points), wasPoints: g.wasPoints ? String(g.wasPoints) : "", stock: String(g.stock), image: g.image, active: g.active });
/** Admin > Membership: the gifts members can exchange for points, and the list of exchanges to hand over. */
export default function GiftsSection({ onMsg }: { onMsg: (m: Msg) => void }) {
  const { t } = useI18n(); const { data } = useAdmin<{ gifts: Gift[]; redemptions: Redemption[] }>("/admin/gifts"); const [f, setF] = useState<Form>(blank()); const [busy, setBusy] = useState(false); const [showDone, setShowDone] = useState(false);
  if (!data) return <Skeleton />;
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  async function save(e: FormEvent) { e.preventDefault(); if (busy) return; setBusy(true); const r = await send("/admin/gifts/save", f, f.id ? "Gift saved" : "Gift added"); setBusy(false); onMsg(r); if (r.ok) setF(blank()); }
  const waiting = data.redemptions.filter((r) => r.status === "PENDING"), done = data.redemptions.filter((r) => r.status !== "PENDING");
  const handle = async (r: Redemption, status: "CLAIMED" | "CANCELLED") => { if (status === "CANCELLED" && !confirm(`Cancel "${r.giftName}" for ${r.customerName || r.email}? The points go back to the customer and the gift goes back into stock.`)) return; onMsg(await send("/admin/gifts/redemption", { id: r.id, status }, status === "CLAIMED" ? "Marked as received" : "Cancelled, points returned")); };
  return (<section className={`${card} space-y-4`}>
    <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-extrabold">{t("Points gift exchange")}</h2><p className="text-sm text-mute">{t("Gifts members can redeem with their saved points. Mark each one as received when you hand it over.")}</p></div><p className="shrink-0 text-sm font-bold text-mute">{t("{g} gifts · {r} waiting", { g: data.gifts.length, r: waiting.length })}</p></div>
    <form onSubmit={save} className="space-y-3 rounded-2xl border border-sky-border bg-[#F6FAFF] p-3.5">
      <p className="text-sm font-extrabold">{f.id ? t("Edit gift") : t("Add a gift")}</p>
      <div className="grid gap-3 sm:grid-cols-2"><label className={lab}>{t("Gift name")}<input value={f.name} onChange={set("name")} required maxLength={80} placeholder="e.g. Cloudie Mini Tote Bag" className={`${field} mt-1`} /></label>
        <label className={lab}>{t("Description")}<input value={f.description} onChange={set("description")} maxLength={200} placeholder={t("Short gift description")} className={`${field} mt-1`} /></label></div>
      <div className="grid grid-cols-3 gap-3"><label className={lab}>{t("Points")}<input type="number" min="1" step="1" value={f.points} onChange={set("points")} required className={`${field} mt-1`} /></label>
        <label className={lab}>{t("Was (points, optional)")}<input type="number" min="1" step="1" value={f.wasPoints} onChange={set("wasPoints")} placeholder={t("Sale")} className={`${field} mt-1`} /></label>
        <label className={lab}>{t("Stock")}<input type="number" min="0" step="1" value={f.stock} onChange={set("stock")} required className={`${field} mt-1`} /></label></div>
      <div><p className="mb-1 text-sm font-bold">{t("Gift photo")}</p><ImageUpload value={f.image} path="/admin/promotions/image" onChange={(u) => setF((x) => ({ ...x, image: u }))} hint={t("Shown to members on the Exchange gift list.")} /></div>
      <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={f.active} onChange={(e) => setF((x) => ({ ...x, active: e.target.checked }))} />{t("Show to members")}</label>
      <div className="flex gap-3"><button disabled={busy} className="rounded-full bg-sky px-6 py-2.5 font-extrabold shadow-soft hover:bg-sky-hover disabled:opacity-50">{f.id ? t("Save gift") : t("Add gift")}</button>{f.id && <button type="button" onClick={() => setF(blank())} className="font-bold text-mute hover:underline">{t("Cancel")}</button>}</div></form>
    {data.gifts.length === 0 ? <p className="rounded-xl border border-dashed border-sky-border p-5 text-center text-sm text-mute">{t("No gifts yet. Add your first gift above.")}</p>
      : <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{data.gifts.map((g) => (<li key={g.id} className={`flex gap-3 rounded-2xl border border-sky-border p-3 ${g.active ? "" : "opacity-60"}`}>
        {g.image ? <img src={g.image} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl border border-sky-border object-cover" /> : <span aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-sky-pale text-2xl">🎁</span>}
        <div className="min-w-0 flex-1"><p className="truncate font-extrabold">{g.name}{!g.active && <span className="ml-1 text-xs font-semibold text-mute">({t("hidden")})</span>}</p><p className="text-sm font-bold text-[#5B3FC8]">{g.points} pts{g.wasPoints ? <s className="ml-1 text-mute">{g.wasPoints}</s> : null} <span className="font-semibold text-mute">· {t("{n} in stock", { n: g.stock })}</span></p>
          <div className="flex gap-3 text-sm font-bold"><button type="button" onClick={() => { setF(toForm(g)); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-sky-hover hover:underline">{t("Edit")}</button>
            <button type="button" onClick={() => { if (confirm(`Remove the gift "${g.name}"?`)) void send("/admin/gifts/delete", { id: g.id }, "Gift removed").then(onMsg); }} className="text-red-700 hover:underline">{t("Remove")}</button></div></div></li>))}</ul>}
    <div><h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-mute">{t("To hand over ({n})", { n: waiting.length })}</h3>
      {waiting.length === 0 ? <p className="text-sm text-mute">{t("Nothing waiting.")}</p> : <ul className="divide-y divide-sky-border rounded-2xl border border-sky-border text-sm">{waiting.map((r) => <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3"><div className="min-w-0"><p className="font-extrabold">{r.giftName} <span className="font-semibold text-mute">· {r.points} pts</span></p><p className="truncate text-mute">{r.customerName || "—"} · {r.email} · {new Date(r.createdAt).toLocaleDateString()}</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => void handle(r, "CLAIMED")} className="rounded-full bg-sky px-4 py-1.5 font-bold hover:bg-sky-hover">{t("Mark received")}</button><button type="button" onClick={() => void handle(r, "CANCELLED")} className="rounded-full border border-sky-border px-4 py-1.5 font-bold text-red-700">{t("Cancel")}</button></div></li>)}</ul>}
      {done.length > 0 && <button type="button" onClick={() => setShowDone((v) => !v)} className="mt-2 text-sm font-bold text-sky-hover hover:underline">{showDone ? t("Hide finished") : t("Show finished ({n})", { n: done.length })}</button>}
      {showDone && <ul className="mt-2 divide-y divide-sky-border rounded-2xl border border-sky-border text-sm">{done.slice(0, 100).map((r) => <li key={r.id} className="flex justify-between gap-2 p-3"><span className="min-w-0 truncate">{r.giftName} · {r.customerName || r.email}</span><span className={`shrink-0 font-bold ${r.status === "CLAIMED" ? "text-green-700" : "text-mute"}`}>{r.status === "CLAIMED" ? t("Received") : t("Cancelled")}</span></li>)}</ul>}</div>
  </section>);
}
