import { useState } from "react";
import { post } from "@/lib/api";
import { useMembership, useGifts } from "@/lib/membership";
import { useI18n } from "@/lib/i18n";
import CloudMascot from "./CloudMascot";
/** Exchange Gift: gift cards in a row (points pill on the picture), what the customer already redeemed. Points come from paid orders after the first level; the server checks every exchange. */
export default function GiftExchange() {
  const { t } = useI18n(); const { tier, points, redemptions, refresh } = useMembership(); const { gifts, refresh: refreshGifts } = useGifts();
  const [busy, setBusy] = useState(""); const [sure, setSure] = useState(""); const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  async function redeem(id: string) {
    if (busy) return; setBusy(id); setMsg(null);
    try { const j = await (await post("/membership/redeem", { giftId: id })).json().catch(() => ({})) as { ok?: boolean; error?: string }; if (j.ok) { setMsg({ ok: true, text: t("Yay! We'll reach out soon to hand over your gift 🎁") }); refresh(); refreshGifts(); } else setMsg({ text: t(j.error ?? "Oops, we couldn't swap that just now. Please try again.") }); }
    catch { setMsg({ text: t("Oops, we couldn't connect. Please try again in a moment.") }); } finally { setBusy(""); setSure(""); }
  }
  const status = (s: string) => (s === "CLAIMED" ? t("Received") : s === "CANCELLED" ? t("Cancelled") : t("Waiting for hand-over"));
  return (<section aria-label={t("Points and gifts")} className="relative overflow-hidden rounded-3xl border border-white bg-gradient-to-b from-[#EEE9FF] to-[#E6F1FF] p-4 shadow-soft sm:p-5">
    <div className="flex items-center gap-3"><span aria-hidden="true" className="text-5xl">🎁</span><div><h2 className="font-display text-2xl font-extrabold text-[#2B1A8F]">{t("Exchange gift")}</h2><p className="text-sm font-semibold text-[#3B4D73]">{t("Swap your points for special gifts, just for you!")}</p></div></div>
    {gifts.length === 0 ? <p className="mt-3 text-mute">{t("No gifts yet, but we're picking some special ones for you. Come back soon!")}</p> : <div className="mt-4 flex gap-3 lg:gap-4"><div className="hidden w-32 shrink-0 flex-col items-center justify-center lg:flex"><CloudMascot className="h-28 w-28" /></div>
      <ul className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{gifts.map((g) => { const out = g.stock <= 0, short = points < g.points; return (<li key={g.id} className="flex flex-col rounded-2xl border border-white bg-white p-2 shadow-soft">
        <div className="relative">{g.image ? <img src={g.image} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" /> : <span aria-hidden="true" className="grid aspect-[4/3] w-full place-items-center rounded-xl bg-sky-pale text-4xl">🎁</span>}
          <span className="absolute left-1.5 top-1.5 rounded-full bg-[#4B2FC0] px-2.5 py-0.5 text-xs font-extrabold text-white shadow">{g.points} {t("pts")}{g.wasPoints ? <s className="ml-1 font-semibold opacity-70">{g.wasPoints}</s> : null}</span></div>
        <p className="mt-2 px-1 font-display text-sm font-extrabold leading-tight text-[#2B1A8F]">{g.name}</p>{g.description && <p className="px-1 text-xs text-mute">{g.description}</p>}<p className="px-1 text-[11px] font-semibold text-mute">{out ? t("Out of stock") : t("{n} in stock", { n: g.stock })}</p>
        <div className="mt-auto pt-2">{sure === g.id ? <div className="flex gap-1.5"><button disabled={!!busy} onClick={() => void redeem(g.id)} className="btn-blue min-h-10 flex-1 rounded-full px-2 text-xs font-extrabold disabled:opacity-50">{busy === g.id ? t("Exchanging…") : t("Yes, exchange {n} pts", { n: g.points })}</button><button disabled={!!busy} onClick={() => setSure("")} className="min-h-10 rounded-full border border-sky-border px-3 text-xs font-bold">{t("Cancel")}</button></div>
          : <button disabled={out || short || !tier} onClick={() => { setMsg(null); setSure(g.id); }} className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full bg-[#E6EEFF] px-2 text-xs font-extrabold text-[#2B3FA8] hover:bg-[#D5E3FF] disabled:cursor-not-allowed disabled:opacity-50"><span aria-hidden="true">🎁</span>{out ? t("Out of stock") : short || !tier ? t("Need {n} more pts", { n: Math.max(0, g.points - points) }) : t("Exchange gift")}</button>}</div></li>); })}</ul></div>}
    {msg && <p role={msg.ok ? "status" : "alert"} className={`mt-3 font-bold ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</p>}
    {redemptions.length > 0 && <div className="mt-4 rounded-2xl bg-white/80 p-3"><h3 className="text-sm font-extrabold text-[#2B1A8F]">{t("My gifts")}</h3><ul className="mt-1 divide-y divide-sky-border text-sm">{redemptions.map((r) => <li key={r.id} className="flex items-center justify-between gap-2 py-1.5"><span className="min-w-0 truncate font-semibold">{r.giftName}</span><span className="shrink-0 text-mute">−{r.points} {t("pts")} · {status(r.status)}</span></li>)}</ul></div>}
  </section>);
}
