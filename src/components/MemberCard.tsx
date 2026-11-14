import { useMembership } from "@/lib/membership";
import { useI18n } from "@/lib/i18n";
import { perkDetail } from "@shared/membership";
import TierBadge from "./TierBadge";
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
/** "My membership" card on the account page: current level, progress to the next level, this level's specials (with this month's use) and the whole ladder. */
export default function MemberCard() {
  const { t } = useI18n(); const { tier, next, tiers, spendCents, used, loading } = useMembership(); const ladder = tiers.filter((x) => x.active);
  if (ladder.length === 0) return null;
  const base = tier?.minSpendCents ?? 0, pct = next ? Math.min(100, Math.max(3, Math.round(((spendCents - base) / (next.minSpendCents - base)) * 100))) : 100;
  const perks = tier?.perks.filter((p) => p.active) ?? [];
  return (<section aria-label={t("Membership")} className="space-y-3 rounded-xl2 border border-sky-border bg-white p-5 shadow-soft">
    <div className="flex items-center gap-3"><TierBadge tier={tier} size={48} />
      <div><p className="text-xs font-extrabold uppercase tracking-wide text-mute">{t("My membership")}</p><p className="text-lg font-extrabold text-[#1F4E9C]">{loading ? "…" : tier ? t("{name} member", { name: tier.name }) : t("Not a member yet")}</p></div>
      <p className="ml-auto text-right text-xs text-mute">{t("Total paid")}<br /><b className="text-base text-ink">{usd(spendCents)}</b></p></div>
    <div><div className="h-2.5 overflow-hidden rounded-full bg-sky-pale" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-[#FF7BA9]" style={{ width: `${pct}%` }} /></div>
      <p className="mt-1.5 text-sm text-mute">{next ? t("Spend {amount} more to become {name}.", { amount: usd(next.minSpendCents - spendCents), name: next.name }) : t("You are at our top level. Thank you!")}</p></div>
    {tier && (perks.length > 0
      ? <div><p className="text-sm font-extrabold">{t("Your {name} specials", { name: tier.name })}</p><ul className="mt-1 space-y-1 text-sm">{perks.map((p) => { const n = used[p.id] ?? 0, left = p.monthlyLimit > 0 ? Math.max(0, p.monthlyLimit - n) : null; return (<li key={p.id} className="flex gap-2"><span aria-hidden="true" className="text-[#FF7BA9]">♡</span><span><b>{p.title}</b>{p.kind !== "custom" && <span className="text-mute"> · {perkDetail(p, t)}</span>}
          {left !== null && <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${left === 0 ? "bg-red-100 text-red-700" : "bg-sky-pale text-[#1F4E9C]"}`}>{left === 0 ? t("Used up this month") : t("{n} left this month", { n: left })}</span>}</span></li>); })}</ul></div>
      : <p className="text-sm text-mute">{t("No specials for {name} yet. Check back soon!", { name: tier.name })}</p>)}
    <details className="text-sm"><summary className="cursor-pointer font-bold text-[#4A86D8]">{t("All membership levels")}</summary>
      <ul className="mt-2 space-y-2">{ladder.map((x) => { const ps = x.perks.filter((p) => p.active); return (<li key={x.id} className={`rounded-xl border p-3 ${x.id === tier?.id ? "border-sky bg-sky-pale" : "border-sky-border"}`}><p className="flex items-center gap-2 font-extrabold"><TierBadge tier={x} size={28} className="rounded-lg" /><span>{x.name} <span className="font-semibold text-mute">· {t("spend {amount}", { amount: usd(x.minSpendCents) })}</span></span></p>
        {ps.length > 0 ? <ul className="mt-1 list-disc pl-5 text-mute">{ps.map((p) => <li key={p.id}>{p.title}{p.kind !== "custom" ? ` (${perkDetail(p, t)})` : p.monthlyLimit > 0 ? ` (${t("max {n} a month", { n: p.monthlyLimit })})` : ""}</li>)}</ul> : <p className="mt-1 text-mute">{t("Specials coming soon.")}</p>}</li>); })}</ul></details></section>);
}
