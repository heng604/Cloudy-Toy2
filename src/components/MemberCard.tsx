import { Link } from "react-router-dom";
import { useMembership } from "@/lib/membership";
import { useI18n } from "@/lib/i18n";
import { perkName } from "@shared/membership";
import TierBadge from "./TierBadge";
import Avatar from "./Avatar";
import ScaledBanner from "./ScaledBanner";
import { useSettings } from "@/lib/store";
import CloudMascot from "./CloudMascot";
import { HAND } from "./OfferDeco";
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
const Star = ({ className = "" }: { className?: string }) => (<svg viewBox="0 0 24 24" aria-hidden="true" className={`pointer-events-none absolute ${className}`}><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="#FFE45C" stroke="#F5C518" strokeWidth="1.2" strokeLinejoin="round" /><circle cx="9.6" cy="11" r=".9" fill="#5B3A1E" /><circle cx="14.4" cy="11" r=".9" fill="#5B3A1E" /></svg>);
const Heart = ({ className = "" }: { className?: string }) => (<svg viewBox="0 0 24 24" aria-hidden="true" className={`pointer-events-none absolute ${className}`}><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.800-8 11-8 11z" fill="#FF8FB5" stroke="#fff" strokeWidth="1.5" /></svg>);

/** Full-width cover (edge to edge, like a Facebook cover). Uses the picture the admin set on Admin > Settings; without one it shows the drawn sky banner. */
export function MemberHero() {
  const { t } = useI18n(); const { settings } = useSettings(); const img = settings.membershipBannerImage, k = (settings.imageSizes?.["membership-banner"] ?? 100) / 100;
  const bleed = "relative left-1/2 -mt-5 w-screen -translate-x-1/2 sm:-mt-8"; // break out of the page width: touches the left and right edge of the screen
  if (img) return <div className={bleed}><ScaledBanner src={img} k={k} fetchPriority="high" className="max-h-[26rem] bg-[#CFE6FF]" /></div>;
  return (<div className={`${bleed} overflow-hidden bg-gradient-to-b from-[#A9D6FF] via-[#C9E6FF] to-[#EAF5FF]`} style={{ minHeight: `${Math.round(11 * k)}rem` }}>
    <div className="relative mx-auto h-full max-w-5xl px-5 py-6 sm:px-8 sm:py-9" style={{ minHeight: "inherit" }}>
      <span aria-hidden="true" className="pointer-events-none absolute -left-6 bottom-[-18px] h-20 w-48 rounded-full bg-white/80" /><span aria-hidden="true" className="pointer-events-none absolute left-1/3 top-3 h-12 w-32 rounded-full bg-white/70" /><span aria-hidden="true" className="pointer-events-none absolute right-24 bottom-[-14px] h-16 w-56 rounded-full bg-white/80" />
      <Star className="left-3 top-3 h-8 w-8 rotate-[-12deg]" /><Star className="right-[34%] top-4 h-7 w-7 rotate-12" /><Star className="right-6 top-16 h-9 w-9 rotate-12" /><Heart className="right-[26%] top-3 h-6 w-6" /><Heart className="right-3 bottom-6 h-6 w-6" />
      <div className="relative max-w-[70%] sm:max-w-[60%]">
        <h1 className="font-display text-4xl font-extrabold leading-none text-[#2B1A8F] sm:text-6xl" style={{ WebkitTextStroke: "6px #fff", paintOrder: "stroke fill", textShadow: "0 4px 0 rgba(43,26,143,.12)" }}>{t("Membership")}</h1>
        <p className={`${HAND} mt-2 inline-block border-b-[3px] border-[#FF7BA9] pb-0.5 text-lg font-bold text-[#2B1A8F] sm:text-2xl`}>{t("Shop, earn points, unlock cuter perks")} ♡</p></div>
      <CloudMascot className="absolute -bottom-2 right-3 h-28 w-28 drop-shadow-lg sm:right-10 sm:h-44 sm:w-44" /></div></div>);
}

/** Facebook-style profile row: big round picture overlapping the bottom of the cover (168px on desktop, 120px on phones, white ring), name 32px bold beside it, level and email under it. */
export function ProfileHeader({ src, name, email }: { src?: string; name: string; email: string }) {
  const { t } = useI18n(); const { tier } = useMembership();
  return (<div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-3 px-1 sm:flex-row sm:items-end sm:gap-5">
    <Avatar src={src} name={name} size={168} className="!h-[120px] !w-[120px] -mt-[60px] border-4 !border-white bg-white shadow-soft sm:!h-[168px] sm:!w-[168px] sm:-mt-[84px] [&>span]:text-[3rem] sm:[&>span]:text-[4.2rem]" />
    <div className="min-w-0 flex-1 pb-2 text-center sm:text-left"><h2 className="truncate font-display text-[1.75rem] font-extrabold leading-tight text-ink sm:text-[2rem]">{name}</h2>
      <p className="truncate text-[15px] text-mute">{email}</p>
      {tier && <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#EAE6FF] px-3 py-0.5 text-xs font-extrabold text-[#5B3FC8]"><TierBadge tier={tier} size={18} className="!rounded-full bg-transparent" />{t("{name} member", { name: tier.name })}</span>}</div>
    <Link to="/account/profile" className="mb-2 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#E6EEFF] px-4 text-sm font-extrabold text-[#2B3FA8] hover:bg-[#D5E3FF]">✎ {t("Edit profile")}</Link></div>);
}

/** "Hi, Bronze friend!" card with the progress bar to the next level, and this level's specials. */
export function TierCard() {
  const { t } = useI18n(); const { tier, next, spendCents, used, loading, points } = useMembership();
  const pct = next ? (tier ? 3 : Math.min(100, Math.max(3, Math.round((spendCents / next.minSpendCents) * 100)))) : 100; // before the first level the bar fills with what they paid; after that an upgrade is ONE order
  const perks = tier?.perks.filter((p) => p.active) ?? [];
  return (<section aria-label={t("My membership")} className="rounded-3xl border border-white bg-white/90 p-4 shadow-soft sm:p-5">
    <div className="flex items-center gap-3"><TierBadge tier={tier} size={72} className="rounded-3xl border-2 border-white bg-gradient-to-b from-[#FFF4D6] to-[#FFE2A8] shadow-soft" />
      <div className="min-w-0"><span className="inline-block rounded-full bg-[#EAE6FF] px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[#5B3FC8]">{loading ? "…" : tier ? t("{name} member", { name: tier.name }) : t("Not a member yet")}</span>
        <p className="font-display text-2xl font-extrabold leading-tight text-[#2B1A8F]">{tier ? t("Hi, {name} friend!", { name: tier.name }) : t("Hi there, friend!")}</p>
        <p className="text-sm text-mute">{t("{n} points total", { n: points })}</p></div></div>
    {tier?.description && <p className="mt-3 whitespace-pre-line rounded-2xl bg-[#F3F8FF] p-3 text-sm text-[#3B4D73]">{tier.description}</p>}
    <div className="mt-4"><p className="text-sm font-extrabold text-[#2B1A8F]">{next ? (tier ? t("Pay {amount} or more in ONE order to unlock {name}", { amount: usd(next.singleOrderCents), name: next.name.toUpperCase() }) : t("Spend {amount} more to unlock {name}", { amount: usd(Math.max(0, next.minSpendCents - spendCents)), name: next.name.toUpperCase() })) : t("You're at our top level. Thank you so much for being with us! 💙")}</p>
      <div className="mt-2 flex items-center gap-3"><span className="rounded-full bg-[#DCE8FF] px-2.5 py-0.5 text-xs font-extrabold text-[#3D58C8]">{pct}%</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-[#E3EEFB]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-gradient-to-r from-[#7FB5FF] to-[#5B8DF0]" style={{ width: `${pct}%` }} /></div></div>
      <p className="mt-1 text-sm text-mute">{next && !tier ? `${usd(spendCents)} / ${usd(next.minSpendCents)} ${t("paid")}` : `${t("Total paid")} ${usd(spendCents)}`}</p></div>
    {tier && (perks.length > 0 ? <ul className="mt-3 space-y-1.5 border-t border-sky-border pt-3 text-sm">{perks.map((p) => { const n = used[p.id] ?? 0, left = p.monthlyLimit > 0 ? Math.max(0, p.monthlyLimit - n) : null; return (<li key={p.id} className="flex items-start gap-2">{p.kind === "custom" && p.image ? <img src={p.image} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-xl border border-sky-border object-cover" /> : <span aria-hidden="true" className="text-[#FF7BA9]">♡</span>}<span><b>{perkName(p, t)}</b>{p.kind === "custom" && p.detail && <span className="block text-xs text-mute">{p.detail}</span>}{left !== null && <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${left === 0 ? "bg-red-100 text-red-700" : "bg-[#EAE6FF] text-[#5B3FC8]"}`}>{left === 0 ? t("Used up this month") : t("{n} left this month", { n: left })}</span>}</span></li>); })}</ul>
      : <p className="mt-3 text-sm text-mute">{t("No specials for {name} yet. Check back soon!", { name: tier.name })}</p>)}
  </section>);
}

/** Points wallet card (blue, with sparkles) */
export function PointsWallet() {
  const { t } = useI18n(); const { tier, points, pointCents, tiers, loading } = useMembership(); const first = tiers.find((x) => x.active);
  return (<section aria-label={t("Points wallet")} className="relative overflow-hidden rounded-3xl border border-white bg-gradient-to-br from-[#D6E9FF] to-[#BBD8FF] p-4 shadow-soft sm:p-5">
    <Star className="right-4 top-3 h-7 w-7 rotate-12" /><Star className="right-12 top-10 h-4 w-4" />
    <p className="text-xs font-extrabold uppercase tracking-wide text-[#3D58C8]">{t("Points wallet")}</p>
    <p className="font-display text-5xl font-extrabold text-[#2B1A8F]">{loading ? "…" : points} <span className="text-2xl">{t("pts")}</span></p>
    <p className="mt-1 max-w-sm text-sm text-[#3B4D73]">{tier ? t("You earn 1 point for every {amount} you spend after your first {first}. Delivery doesn't count. Save them up and swap them for gifts!", { amount: usd(pointCents), first: first ? usd(first.minSpendCents) : "" }) : t("Join us as a member and start collecting points you can swap for lovely gifts!")}</p>
    <Link to="/shop" className="btn-blue mt-4 inline-flex min-h-11 items-center gap-2 rounded-full px-6 font-extrabold">🛍 {t("Keep shopping")}</Link></section>);
}

/** All the levels as four cute cards; levels you have not reached show a little lock. */
export function LevelsGrid() {
  const { t } = useI18n(); const { tier, tiers } = useMembership(); const ladder = tiers.filter((x) => x.active); const at = ladder.findIndex((x) => x.id === tier?.id);
  if (ladder.length === 0) return null;
  return (<section aria-label={t("Membership Levels")} className="rounded-3xl border border-white bg-white/80 p-4 shadow-soft sm:p-5">
    <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold text-[#2B1A8F]"><span aria-hidden="true">⭐</span>{t("Membership Levels")}</h2><p className="text-sm text-mute">{t("You'll level up on your own as you shop with us.")}</p>
    <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{ladder.map((x, i) => { const ps = x.perks.filter((p) => p.active); const mine = i === at, locked = i > at; return (
      <li key={x.id} className={`relative rounded-2xl border p-3 ${mine ? "border-[#5B8DF0] bg-[#EEF4FF] shadow-soft" : "border-sky-border bg-white"}`}>
        <span aria-hidden="true" className="absolute right-3 top-3 text-lg text-slate-400">{locked ? "🔒" : mine ? "💙" : "✓"}</span>
        <TierBadge tier={x} size={52} className="rounded-2xl bg-gradient-to-b from-[#FFF4D6] to-[#FFE2A8]" />
        <p className="mt-1 font-display text-xl font-extrabold text-[#2B1A8F]">{x.name}</p>{x.description && <p className="mt-1 whitespace-pre-line text-sm text-[#3B4D73]">{x.description}</p>}
        <p className="text-xs text-mute">{i === 0 ? t("After paying {amount}", { amount: usd(x.minSpendCents) }) : t("one order of {amount}", { amount: usd(x.singleOrderCents) })}</p>
        <div className="mt-2 space-y-1.5">{ps.length > 0 ? ps.map((p) => <p key={p.id} className="rounded-xl bg-[#E4EFFD] px-2.5 py-1.5 text-xs font-semibold text-[#2B3F6B]">{perkName(p, t)}{p.kind !== "custom" ? "" : p.monthlyLimit > 0 ? ` (${t("max {n} a month", { n: p.monthlyLimit })})` : ""}</p>) : <p className="text-xs text-mute">{t("Specials coming soon.")}</p>}</div></li>); })}</ul></section>);
}
