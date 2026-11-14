import { useMembership } from "@/lib/membership";
import { perkDetail } from "@shared/membership";
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
/** "My membership" card on the account page: current level, progress to the next level, this level's specials and the whole ladder. */
export default function MemberCard() {
  const { tier, next, tiers, spendCents, loading } = useMembership(); const ladder = tiers.filter((t) => t.active);
  if (ladder.length === 0) return null;
  const base = tier?.minSpendCents ?? 0, pct = next ? Math.min(100, Math.max(3, Math.round(((spendCents - base) / (next.minSpendCents - base)) * 100))) : 100;
  return (<section aria-label="Membership" className="space-y-3 rounded-xl2 border border-sky-border bg-white p-5 shadow-soft">
    <div className="flex items-center gap-3"><span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-pale text-2xl">{tier?.emoji || "☁️"}</span>
      <div><p className="text-xs font-extrabold uppercase tracking-wide text-mute">My membership</p><p className="text-lg font-extrabold text-[#1F4E9C]">{loading ? "…" : tier ? `${tier.name} member` : "Not a member yet"}</p></div>
      <p className="ml-auto text-right text-xs text-mute">Total paid<br /><b className="text-base text-ink">{usd(spendCents)}</b></p></div>
    <div><div className="h-2.5 overflow-hidden rounded-full bg-sky-pale" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-[#FF7BA9]" style={{ width: `${pct}%` }} /></div>
      <p className="mt-1.5 text-sm text-mute">{next ? <>Spend <b className="text-ink">{usd(next.minSpendCents - spendCents)}</b> more to become <b className="text-ink">{next.emoji} {next.name}</b>.</> : "You are at our top level. Thank you!"}</p></div>
    {tier && (tier.perks.filter((p) => p.active).length > 0
      ? <div><p className="text-sm font-extrabold">Your {tier.name} specials</p><ul className="mt-1 space-y-1 text-sm">{tier.perks.filter((p) => p.active).map((p) => <li key={p.id} className="flex gap-2"><span aria-hidden="true" className="text-[#FF7BA9]">♡</span><span><b>{p.title}</b>{p.kind !== "custom" && <span className="text-mute"> · {perkDetail(p)}</span>}</span></li>)}</ul></div>
      : <p className="text-sm text-mute">No specials for {tier.name} yet. Check back soon!</p>)}
    <details className="text-sm"><summary className="cursor-pointer font-bold text-[#4A86D8]">All membership levels</summary>
      <ul className="mt-2 space-y-2">{ladder.map((t) => <li key={t.id} className={`rounded-xl border p-3 ${t.id === tier?.id ? "border-sky bg-sky-pale" : "border-sky-border"}`}><p className="font-extrabold">{t.emoji} {t.name} <span className="font-semibold text-mute">· spend {usd(t.minSpendCents)}</span></p>
        {t.perks.filter((p) => p.active).length > 0 ? <ul className="mt-1 list-disc pl-5 text-mute">{t.perks.filter((p) => p.active).map((p) => <li key={p.id}>{p.title}{p.kind !== "custom" ? ` (${perkDetail(p)})` : ""}</li>)}</ul> : <p className="mt-1 text-mute">Specials coming soon.</p>}</li>)}</ul></details></section>);
}
