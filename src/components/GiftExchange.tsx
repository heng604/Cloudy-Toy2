import { useState } from "react";
import { post } from "@/lib/api";
import { useMembership, useGifts } from "@/lib/membership";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/lib/store";
import CloudMascot from "./CloudMascot";
/** Little ribbon bow that sits on the corner of every gift picture. */
const Bow = ({ className = "" }: { className?: string }) => (<svg viewBox="0 0 48 36" aria-hidden="true" className={`pointer-events-none absolute ${className}`}><path d="M24 20C14 6 3 5 3 13s11 9 21 7zM24 20c10-14 21-15 21-7s-11 9-21 7z" fill="#7FB8F7" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" /><path d="M24 20l-7 14M24 20l7 14" stroke="#7FB8F7" strokeWidth="4" strokeLinecap="round" /><circle cx="24" cy="19" r="5" fill="#3D86E0" stroke="#fff" strokeWidth="2.5" /></svg>);
const Spark = ({ className = "" }: { className?: string }) => (<svg viewBox="0 0 24 24" aria-hidden="true" className={`pointer-events-none absolute ${className}`}><path d="M12 2l2.4 7.1L22 12l-7.6 2.9L12 22l-2.4-7.1L2 12l7.6-2.9z" fill="#FFE45C" stroke="#F5C518" strokeWidth="1.2" strokeLinejoin="round" /></svg>);
/** Exchange Gift: a warm "gift shelf" with a card per gift (how close you are shows as a little bar), then "My gifts" as a keepsake list. The admin picks the background picture / colour in Admin > Settings. Points come from paid orders after the first level; the server checks every exchange. */
export default function GiftExchange() {
  const { t } = useI18n(); const { tier, points, redemptions, refresh } = useMembership(); const { gifts, refresh: refreshGifts } = useGifts(); const { settings } = useSettings();
  const [busy, setBusy] = useState(""); const [sure, setSure] = useState(""); const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  async function redeem(id: string) {
    if (busy) return; setBusy(id); setMsg(null);
    try { const j = await (await post("/membership/redeem", { giftId: id })).json().catch(() => ({})) as { ok?: boolean; error?: string }; if (j.ok) { setMsg({ ok: true, text: t("Yay! We'll reach out soon to hand over your gift 🎁") }); refresh(); refreshGifts(); } else setMsg({ text: t(j.error ?? "Oops, we couldn't swap that just now. Please try again.") }); }
    catch { setMsg({ text: t("Oops, we couldn't connect. Please try again in a moment.") }); } finally { setBusy(""); setSure(""); }
  }
  const status = (s: string) => (s === "CLAIMED" ? t("Received") : s === "CANCELLED" ? t("Cancelled") : t("Waiting for hand-over"));
  const pill = (s: string) => (s === "CLAIMED" ? "bg-emerald-100 text-emerald-800" : s === "CANCELLED" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800");
  const day = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); };
  const bgImg = settings.giftBackgroundImage, bgColor = settings.giftBackgroundColor;
  return (<section aria-label={t("Points and gifts")} className="relative overflow-hidden rounded-[2rem] border-2 border-white bg-gradient-to-br from-[#E4F1FF] via-[#DCEEFF] to-[#CFE6FF] p-4 shadow-soft sm:p-6" style={{ ...(bgColor ? { backgroundColor: bgColor, backgroundImage: "none" } : {}), ...(bgImg ? { backgroundImage: `url("${bgImg}")`, backgroundSize: "cover", backgroundPosition: "center" } : {}) }}>
    {bgImg && <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-white/45" />}
    <Spark className="right-24 top-4 h-5 w-5" /><Spark className="right-6 top-16 h-4 w-4" /><Spark className="left-1/2 top-3 hidden h-4 w-4 sm:block" />
    <div className="relative flex flex-wrap items-center gap-3 sm:gap-4">
      <span aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl border-2 border-white bg-gradient-to-b from-[#EAF4FF] to-[#CFE6FF] text-4xl shadow-soft">🎁</span>
      <div className="min-w-0 flex-1"><h2 className="font-display text-2xl font-extrabold leading-tight text-[#2B1A8F] sm:text-3xl">{t("Exchange gift")}</h2><p className="text-sm font-semibold text-[#3B4D73]">{t("Swap your points for special gifts, just for you!")}</p></div>
      <div className="flex items-center gap-2"><span className="rounded-full border-2 border-white bg-white/90 px-4 py-1.5 font-display text-sm font-extrabold text-[#2B1A8F] shadow-soft">⭐ {t("You have {n} pts", { n: points })}</span><CloudMascot className="hidden h-16 w-16 drop-shadow sm:block" /></div></div>
    {gifts.length === 0 ? <p className="relative mt-4 rounded-2xl bg-white/80 p-4 text-center font-semibold text-[#3B4D73]">{t("No gifts yet, but we're picking some special ones for you. Come back soon!")}</p>
      : <ul className="relative mt-5 grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{gifts.map((g) => { const out = g.stock <= 0, short = points < g.points, can = !out && !short && !!tier, pct = g.points > 0 ? Math.min(100, Math.round((points / g.points) * 100)) : 100; return (
        <li key={g.id} className={`group relative flex flex-col rounded-3xl border-2 bg-white p-2.5 shadow-soft transition-transform hover:-translate-y-0.5 ${can ? "border-[#8EC3FA]" : "border-white"}`}>
          <div className="relative">{g.image ? <img src={g.image} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover" /> : <span aria-hidden="true" className="grid aspect-[4/3] w-full place-items-center rounded-2xl bg-gradient-to-br from-[#EAF4FF] to-[#D6EAFF] text-5xl">🎁</span>}
            <Bow className="-right-2 -top-3 h-9 w-12 rotate-[14deg]" />
            <span className="absolute bottom-2 left-2 rounded-full bg-gradient-to-r from-[#5BAEF5] to-[#3D86E0] px-3 py-1 text-xs font-extrabold text-white shadow-md">{g.points} {t("pts")}{g.wasPoints ? <s className="ml-1 font-semibold opacity-70">{g.wasPoints}</s> : null}</span></div>
          <p className="mt-2.5 px-1 font-display text-base font-extrabold leading-tight text-[#2B1A8F]">{g.name}</p>{g.description && <p className="px-1 text-xs text-mute">{g.description}</p>}
          <p className="px-1 pt-0.5 text-[11px] font-bold text-[#7A8AA8]">{out ? t("Out of stock") : t("{n} in stock", { n: g.stock })}</p>
          {!out && <div className="mt-2 px-1"><div className="h-2 overflow-hidden rounded-full bg-[#E8EEFB]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className={`h-full rounded-full transition-[width] duration-500 bg-gradient-to-r from-[#7FC0FB] to-[#3D86E0]`} style={{ width: `${pct}%` }} /></div><p className="mt-1 text-[11px] font-bold text-[#5B6B8C]">{Math.min(points, g.points)} / {g.points} {t("pts")}</p></div>}
          <div className="mt-auto pt-2">{sure === g.id ? <div className="flex gap-1.5"><button disabled={!!busy} onClick={() => void redeem(g.id)} className="btn-blue min-h-10 flex-1 rounded-full px-2 text-xs font-extrabold disabled:opacity-50">{busy === g.id ? t("Exchanging…") : t("Yes, exchange {n} pts", { n: g.points })}</button><button disabled={!!busy} onClick={() => setSure("")} className="min-h-10 rounded-full border border-sky-border px-3 text-xs font-bold">{t("Cancel")}</button></div>
            : <button disabled={!can} onClick={() => { setMsg(null); setSure(g.id); }} className={`flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full px-2 text-xs font-extrabold disabled:cursor-not-allowed ${can ? "btn-blue shadow-md" : "bg-[#EEF2FB] text-[#8190AE]"}`}><span aria-hidden="true">{can ? "🎁" : out ? "🕊️" : "🔒"}</span>{out ? t("Out of stock") : short || !tier ? t("Need {n} more pts", { n: Math.max(0, g.points - points) }) : t("Exchange gift")}</button>}</div></li>); })}</ul>}
    {msg && <p role={msg.ok ? "status" : "alert"} className={`relative mt-4 rounded-2xl px-4 py-2.5 font-bold ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
    {redemptions.length > 0 && <div className="relative mt-6 rounded-3xl border-2 border-white bg-white/85 p-4 shadow-soft">
      <div className="flex items-center gap-2"><span aria-hidden="true" className="text-2xl">💝</span><div><h3 className="font-display text-xl font-extrabold leading-tight text-[#2B1A8F]">{t("My gifts")}</h3><p className="text-xs font-semibold text-[#5B6B8C]">{t("Gifts you've swapped so far ♡")}</p></div></div>
      <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">{redemptions.map((r) => <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-[#E3EAFB] bg-gradient-to-r from-white to-[#EAF4FF] p-2.5">
        {r.giftImage ? <img src={r.giftImage} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-xl border-2 border-white object-cover shadow-sm" /> : <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#DCEBFF] text-2xl">🎁</span>}
        <div className="min-w-0 flex-1"><p className="truncate font-display text-sm font-extrabold text-[#2B1A8F]">{r.giftName}</p><p className="text-xs text-mute">{day(r.createdAt)}{day(r.createdAt) ? " · " : ""}−{r.points} {t("pts")}</p><span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${pill(r.status)}`}>{status(r.status)}</span></div></li>)}</ul></div>}
  </section>);
}
