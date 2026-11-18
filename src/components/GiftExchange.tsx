import { useState } from "react";
import { post } from "@/lib/api";
import { useMembership, useGifts } from "@/lib/membership";
import { useI18n } from "@/lib/i18n";
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
/** Points wallet + gift exchange + what the customer already redeemed. Points come from paid orders after the first level; the server checks every exchange. */
export default function GiftExchange() {
  const { t } = useI18n(); const { tier, points, pointCents, tiers, redemptions, refresh, loading } = useMembership(); const { gifts, refresh: refreshGifts } = useGifts();
  const [busy, setBusy] = useState(""); const [sure, setSure] = useState(""); const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const first = tiers.find((x) => x.active);
  async function redeem(id: string) {
    if (busy) return; setBusy(id); setMsg(null);
    try { const j = await (await post("/membership/redeem", { giftId: id })).json().catch(() => ({})) as { ok?: boolean; error?: string }; if (j.ok) { setMsg({ ok: true, text: t("Done! We will contact you to hand over your gift.") }); refresh(); refreshGifts(); } else setMsg({ text: t(j.error ?? "Could not exchange. Please try again.") }); }
    catch { setMsg({ text: t("Could not reach the server. Please try again.") }); } finally { setBusy(""); setSure(""); }
  }
  const status = (s: string) => (s === "CLAIMED" ? t("Received") : s === "CANCELLED" ? t("Cancelled") : t("Waiting for hand-over"));
  return (<section aria-label={t("Points and gifts")} className="space-y-4 rounded-xl2 border border-sky-border bg-white p-5 shadow-soft">
    <div className="rounded-2xl bg-[#EAF3FF] p-4"><p className="text-xs font-extrabold uppercase tracking-wide text-[#2F7FC6]">{t("Points wallet")}</p>
      <p className="text-4xl font-extrabold text-[#1F4E9C]">{loading ? "…" : points} <span className="text-lg">{t("pts")}</span></p>
      <p className="mt-1 text-sm text-mute">{tier ? t("You get 1 point for every {amount} you pay after your first {first}. Delivery is not counted. Use your points to exchange gifts.", { amount: usd(pointCents), first: first ? usd(first.minSpendCents) : "" }) : t("Become a member to start earning points you can exchange for gifts.")}</p></div>
    <div><h2 className="text-lg font-extrabold">{t("Exchange gift")}</h2><p className="text-sm text-mute">{t("Use your points to redeem exclusive gifts!")}</p>
      {gifts.length === 0 ? <p className="mt-2 text-mute">{t("No gifts yet. Check back soon!")}</p> : <ul className="mt-3 grid gap-3 sm:grid-cols-2">{gifts.map((g) => { const out = g.stock <= 0, short = points < g.points; return (<li key={g.id} className="flex flex-col rounded-2xl border border-sky-border p-3">
        <div className="flex gap-3">{g.image ? <img src={g.image} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-xl border border-sky-border object-cover" /> : <span aria-hidden="true" className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-sky-pale text-3xl">🎁</span>}
          <div className="min-w-0"><p className="font-extrabold">{g.name}</p>{g.description && <p className="text-sm text-mute">{g.description}</p>}
            <p className="mt-1 text-sm font-extrabold text-[#5B3FC8]">{g.points} {t("pts")}{g.wasPoints ? <s className="ml-1 font-semibold text-mute">{g.wasPoints}</s> : null} <span className="font-semibold text-mute">· {out ? t("Out of stock") : t("{n} in stock", { n: g.stock })}</span></p></div></div>
        {sure === g.id ? <div className="mt-2 flex gap-2"><button disabled={!!busy} onClick={() => void redeem(g.id)} className="min-h-10 flex-1 rounded-full bg-sky px-3 font-bold hover:bg-sky-hover disabled:opacity-50">{busy === g.id ? t("Exchanging…") : t("Yes, exchange {n} pts", { n: g.points })}</button><button disabled={!!busy} onClick={() => setSure("")} className="min-h-10 rounded-full border border-sky-border px-3 font-bold">{t("Cancel")}</button></div>
          : <button disabled={out || short || !tier} onClick={() => { setMsg(null); setSure(g.id); }} className="mt-2 min-h-10 rounded-full bg-sky px-3 font-bold hover:bg-sky-hover disabled:cursor-not-allowed disabled:opacity-50">{out ? t("Out of stock") : short || !tier ? t("Need {n} more pts", { n: Math.max(0, g.points - points) }) : t("Exchange gift")}</button>}</li>); })}</ul>}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mt-2 font-bold ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</p>}</div>
    {redemptions.length > 0 && <div><h3 className="text-sm font-extrabold">{t("My gifts")}</h3><ul className="mt-1 divide-y divide-sky-border text-sm">{redemptions.map((r) => <li key={r.id} className="flex items-center justify-between gap-2 py-1.5"><span className="min-w-0 truncate font-semibold">{r.giftName}</span><span className="shrink-0 text-mute">−{r.points} {t("pts")} · {status(r.status)}</span></li>)}</ul></div>}
  </section>);
}
