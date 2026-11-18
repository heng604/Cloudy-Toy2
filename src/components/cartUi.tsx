import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/profile";
import { useMembership } from "@/lib/membership";
import { useI18n } from "@/lib/i18n";
import { perkName, pointsOf } from "@shared/membership";
import TierBadge from "./TierBadge";
/** Shared look of the Cart, Checkout and Payment pages: soft white cards, purple headings, blue pill buttons (same cute style as the Membership page). */
export const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
export const card = "rounded-3xl border border-white bg-white/90 p-4 shadow-soft sm:p-6";
export const field = "mt-1 w-full rounded-2xl border border-sky-border bg-[#F3F8FF] px-4 py-3 text-[15px] focus:border-[#5B8DF0] focus:bg-white read-only:text-mute";
export const radioCard = "flex cursor-pointer items-start gap-3 rounded-2xl border border-sky-border bg-white p-4 text-[15px] transition has-[:checked]:border-[#5B8DF0] has-[:checked]:bg-[#EEF4FF] has-[:checked]:shadow-soft has-[:disabled]:cursor-not-allowed";
export const bigBtn = "btn-blue flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-lg font-extrabold disabled:cursor-not-allowed";
export const cardTitle = "font-display text-xl font-extrabold text-[#2B1A8F]";

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (<div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h1 className="font-display text-3xl font-extrabold text-[#2B1A8F] sm:text-4xl">{title}</h1>{sub && <p className="text-mute">{sub}</p>}</div><div className="flex flex-wrap items-center gap-3">{children}</div></div>);
}
/** "Po Pe · Starter" pill (or "Guest · Starter  Login"). */
export function MemberPill() {
  const { t } = useI18n(); const { user } = useAuth(); const { profile } = useProfile(); const { tier } = useMembership();
  const name = profile?.name || (user?.email ?? "").split("@")[0];
  return (<span className="inline-flex items-center gap-2 rounded-full border border-white bg-white px-4 py-1.5 text-sm font-extrabold text-[#2B1A8F] shadow-soft">
    {user ? <>{name}<span className="text-mute">·</span><span className="text-[#5B3FC8]">{tier?.name ?? t("Starter")}</span></> : <>{t("Guest")}<span className="text-mute">·</span><span className="text-[#5B3FC8]">{t("Starter")}</span><Link to="/login?next=%2Fcheckout" className="text-[#4A86D8] underline">{t("Login")}</Link></>}</span>);
}
export const SecHead = ({ children }: { children: ReactNode }) => <p className="mt-3 text-[11px] font-extrabold uppercase tracking-wide text-mute">{children}</p>;
export const Line = ({ label, value, cls = "" }: { label: ReactNode; value: ReactNode; cls?: string }) => <p className={`flex justify-between gap-3 text-sm ${cls}`}><span>{label}</span><span className="shrink-0 font-semibold">{value}</span></p>;

/** Points this order would give: how many more points the customer's paid total gives after adding this order's goods (delivery not counted). */
export function usePointsPreview(goodsCents: number) {
  const { tiers, spendCents, points, pointCents } = useMembership(); const { user } = useAuth(); const show = !!user && tiers.length > 0;
  const pts = show ? Math.max(0, pointsOf(spendCents + Math.max(0, goodsCents), tiers, pointCents) - pointsOf(spendCents, tiers, pointCents)) : 0;
  return { show, pts, balance: points + pts, pointCents };
}
export function PointsBox({ goodsCents }: { goodsCents: number }) {
  const { t } = useI18n(); const { show, pts, balance, pointCents } = usePointsPreview(goodsCents); if (!show) return null;
  return (<div className="mt-4 rounded-2xl border border-[#D6E6FB] bg-[#EEF4FF] p-3.5"><p className="text-[11px] font-extrabold uppercase tracking-wide text-[#5B3FC8]">3. {t("Resulting points earned")}</p>
    <p className="mt-1 flex justify-between font-extrabold text-[#2B1A8F]"><span>{t("Points Earned (This Order)")}</span><span className="font-mono">+{pts} {t("pts")}</span></p>
    <p className="mt-0.5 flex flex-wrap justify-between gap-x-3 text-xs text-mute"><span>{t("On {amount} product spend (@ {rate}/pt)", { amount: usd(Math.max(0, goodsCents)), rate: usd(pointCents) })}</span><b className="text-ink">{t("New balance")}: {balance} {t("pts")}</b></p></div>);
}

/** Member box at the top of the Order summary: level, progress to the next level, gift points and the perks that apply to this cart. */
export function MemberPanel({ billCents }: { billCents: number }) {
  const { t } = useI18n(); const { user } = useAuth(); const { profile } = useProfile(); const { tier, next, tiers, spendCents, points } = useMembership();
  const first = tiers.find((x) => x.active); const perks = tier?.perks.filter((p) => p.active) ?? []; const nextPerks = next?.perks.filter((p) => p.active) ?? [];
  const name = profile?.name || (user?.email ?? "").split("@")[0] || t("Guest");
  let need = t("You are at our top level. Thank you!"), pct = 100, right = "";
  if (next && tier) { const target = next.singleOrderCents; pct = Math.min(100, Math.round((billCents / Math.max(1, target)) * 100)); need = t("Spend {amount} / bill to unlock {name}", { amount: usd(target), name: next.name.toUpperCase() }); right = `${usd(Math.min(Math.max(0, billCents), target))} / ${usd(target)} ${t("this bill")}`; }
  else if (next) { const target = next.minSpendCents; pct = Math.min(100, Math.round((spendCents / Math.max(1, target)) * 100)); need = t("Spend {amount} more to unlock {name}", { amount: usd(Math.max(0, target - spendCents)), name: next.name.toUpperCase() }); right = `${usd(Math.min(spendCents, target))} / ${usd(target)} ${t("paid")}`; }
  if (tiers.filter((x) => x.active).length === 0) return null;
  const pill = tier ? `${tier.name} ${t("member")}` : user ? t("Starter") : `${t("Guest")} · ${t("Starter")}`;
  return (<div className="rounded-3xl border border-[#D6E6FB] bg-gradient-to-b from-[#EEF5FF] to-[#E3EEFF] p-4">
    <div className="flex items-center gap-3"><TierBadge tier={tier} size={44} className="rounded-2xl border-2 border-white bg-white" />
      <div className="min-w-0"><span className="inline-block rounded-full border border-sky-border bg-white px-2.5 py-0.5 text-[11px] font-extrabold uppercase text-[#2B1A8F]">{pill}</span><p className="truncate text-sm text-mute">{name}</p></div>
      {user && <Link to="/account" className="ml-auto shrink-0 text-xs font-extrabold text-[#5B3FC8] underline">{t("View benefits")}</Link>}</div>
    {!user ? <p className="mt-3 text-sm text-[#3B4D73]">{t("Sign in with your email to track spend toward {name} Membership and earn gift points.", { name: first?.name ?? "Bronze" })}</p> : <>
      <p className="mt-3 text-sm font-extrabold text-[#2B1A8F]">{need}</p>
      {next && <><div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-gradient-to-r from-[#7FB5FF] to-[#5B8DF0]" style={{ width: `${pct}%` }} /></div>
        <p className="mt-1 flex justify-between text-xs text-mute"><b className="text-[#3D58C8]">{pct}%</b><span>{right}</span></p></>}
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white pt-3 text-sm"><span>{t("Gift Points")}: <b className="text-[#2B1A8F]">{points} {t("pts")}</b></span><Link to="/account" className="font-extrabold text-[#E0456B] underline">{t("Exchange gifts")}</Link><Link to="/account" className="text-xs font-bold text-[#5B3FC8]">ⓘ {t("How points work")}</Link></p>
      {tier ? <div className="mt-3 border-t border-white pt-3"><p className="text-sm font-extrabold text-[#2B1A8F]">{t("Active tier perks for this cart")}</p>
          {perks.length > 0 ? <ul className="mt-1 space-y-0.5 text-sm">{perks.map((p) => <li key={p.id}><span aria-hidden="true" className="text-[#5B8DF0]">✦</span> <b>{perkName(p, t)}</b></li>)}</ul> : <p className="text-xs text-mute">{t("No specials for {name} yet. Check back soon!", { name: tier.name })}</p>}</div>
        : next && <div className="mt-3 border-t border-white pt-3"><p className="text-sm font-extrabold text-[#2B1A8F]">{t("Unlock member perks")}</p><p className="text-sm text-[#3B4D73]">{t("Spend {amount} more on products to automatically join {name} and unlock automatic discounts.", { amount: usd(Math.max(0, next.minSpendCents - spendCents)), name: next.name })}</p></div>}
      {next && nextPerks.length > 0 && <div className="mt-3 border-t border-white pt-3 text-sm"><p className="font-bold text-mute">🔒 {t("Next in {name}", { name: next.name })}:</p><ul className="mt-0.5 space-y-0.5 pl-5 text-xs text-[#3B4D73]">{nextPerks.map((p) => <li key={p.id}>{perkName(p, t)}</li>)}</ul></div>}</>}
  </div>);
}
