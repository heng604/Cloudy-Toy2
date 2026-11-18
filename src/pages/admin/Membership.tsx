import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/admin/Icons";
import Modal from "@/components/admin/Modal";
import Skeleton from "@/components/Skeleton";
import ImageUpload from "@/components/admin/ImageUpload";
import TierBadge from "@/components/TierBadge";
import Avatar from "@/components/Avatar";
import GiftsSection from "./GiftsSection";
import { post } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useTitle } from "@/lib/title";
import { MAX_PERKS, perkName, type Perk, type PerkKind, type Tier } from "@shared/membership";
import type { Promotions } from "@shared/promotions";
import { useAdmin, refreshAdmin } from "./hooks";
type Msg = { ok: boolean; text: string } | null;
const field = "w-full rounded-xl border border-sky-border bg-[#F3F9FE] px-3.5 py-2.5 outline-none";
const lab = "block text-sm font-bold";
const card = "rounded-3xl border border-sky-border bg-white p-5 shadow-soft sm:p-6";
const statBox = "flex items-center gap-3 rounded-3xl border border-sky-border bg-white p-4 shadow-soft";
const outBtn = "rounded-full border border-sky-border bg-white px-3 py-2 text-sm font-bold text-ink hover:bg-sky-pale disabled:opacity-40";
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
const KIND_NAME: Record<PerkKind, string> = { percent: "% off every order", amount: "$ off every order", free_shipping: "Free delivery", custom: "Other special (written by you)" };
async function send(path: string, body: object, ok: string): Promise<{ ok: boolean; text: string }> {
  try { const j = await (await post(path, body)).json().catch(() => ({})) as { ok?: boolean; error?: string }; if (j.ok) { refreshAdmin(); return { ok: true, text: ok }; } return { ok: false, text: j.error ?? "Could not save. Please try again." }; }
  catch { return { ok: false, text: "Could not reach the server. Please try again." }; }
}
type PerkForm = { id?: string; kind: PerkKind; title: string; percent: string; amount: string; minSpend: string; active: boolean; monthlyLimit: string; onPromo: boolean; detail: string; image: string };
const toForm = (p: Perk): PerkForm => ({ id: p.id, kind: p.kind, title: p.title, percent: p.percent ? String(p.percent) : "", amount: p.amountCents ? String(p.amountCents / 100) : "", minSpend: p.minSpendCents ? String(p.minSpendCents / 100) : "", active: p.active, monthlyLimit: p.monthlyLimit ? String(p.monthlyLimit) : "", onPromo: p.onPromo, detail: p.detail ?? "", image: p.image ?? "" });
const blankPerk = (): PerkForm => ({ kind: "percent", title: "", percent: "5", amount: "", minSpend: "", active: true, monthlyLimit: "", onPromo: true, detail: "", image: "" });

function TierModal({ tier, tiers, onClose, onDone }: { tier?: Tier; tiers: Tier[]; onClose: () => void; onDone: (m: Msg) => void }) {
  const { t } = useI18n(); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [name, setName] = useState(tier?.name ?? ""), [emoji, setEmoji] = useState(tier?.emoji ?? "⭐"), [image, setImage] = useState(tier?.image ?? ""), [spend, setSpend] = useState(tier ? String(tier.minSpendCents / 100) : ""), [single, setSingle] = useState(tier && tier.singleOrderCents ? String(tier.singleOrderCents / 100) : ""), [specialName, setSpecialName] = useState(tier?.specialName ?? "");
  const at = tier ? tiers.findIndex((x) => x.id === tier.id) : tiers.length; const first = at === 0; const before = at > 0 ? tiers[at - 1] : null; // the first level is reached by spend, the others by ONE big order
  const [perks, setPerks] = useState<PerkForm[]>(tier ? tier.perks.map(toForm) : []);
  const setPerk = (i: number, patch: Partial<PerkForm>) => setPerks((l) => l.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  async function submit(e: FormEvent, close: () => void) {
    e.preventDefault(); if (busy) return; setBusy(true); setErr("");
    const r = await send("/admin/promotions/membership/save", { id: tier?.id, active: tier?.active ?? true, name, emoji, image, minSpend: first ? spend : undefined, singleOrder: first ? undefined : single, specialName, perks }, tier ? "Level saved" : "Level added");
    setBusy(false); if (!r.ok) { setErr(r.text); return; } onDone(r); close();
  }
  return (<Modal wide title={tier ? t("Edit membership level") : t("Add membership level")} icon="users" onClose={onClose}>{(close) => (
    <form onSubmit={(e) => submit(e, close)} className="space-y-4 p-5 sm:p-7">
      <div className="grid gap-3 sm:grid-cols-[1fr_6rem_1fr]">
        <label className={lab}>{t("Level name")}<input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={30} placeholder="e.g. Bronze" className={`${field} mt-1`} /></label>
        <label className={lab}>{t("Icon")}<input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={8} className={`${field} mt-1 text-center text-xl`} /></label>
        {first ? <label className={lab}>{t("Customer reaches it after paying (USD)")}<input type="number" min="1" step="0.01" value={spend} onChange={(e) => setSpend(e.target.value)} required placeholder="e.g. 30" className={`${field} mt-1`} /></label>
          : <label className={lab}>{t("One order of at least (USD), after {name}", { name: before?.name ?? "" })}<input type="number" min="1" step="0.01" value={single} onChange={(e) => setSingle(e.target.value)} required placeholder="e.g. 200" className={`${field} mt-1`} /></label>}</div>
      <div className="rounded-2xl border border-sky-border bg-[#F6FAFF] p-3.5"><p className="mb-2 text-sm font-bold">{t("Level picture (optional)")}</p><ImageUpload value={image} path="/admin/promotions/image" onChange={setImage} hint={t("Shown to customers instead of the icon. Leave it empty to use the icon.")} /></div>
      <p className="text-xs text-mute">{first ? t("A customer gets this level automatically when the total of their paid orders (delivery not counted) reaches this amount.") : t("To upgrade to this level the customer must pay this amount in ONE order (delivery not counted), after they already have the level before it.")}</p>
      <div className="space-y-3"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-extrabold uppercase tracking-wide text-mute">{t("Specials for this level")}</h3>
        {perks.length < MAX_PERKS && <button type="button" onClick={() => setPerks((l) => [...l, blankPerk()])} className="text-sm font-extrabold text-[#E0456B] hover:underline">+ {t("Add special")}</button>}</div>
        {perks.some((p) => p.kind !== "custom") && <label className={lab}>{t("Name shown to the customer")}<input value={specialName} onChange={(e) => setSpecialName(e.target.value)} maxLength={60} placeholder={name.trim() || "e.g. Member discount"} className={`${field} mt-1`} /><span className="mt-1 block text-xs font-normal text-mute">{t("One name for all the specials of this level. Every special you add next uses the same name. Leave it empty to use the level name.")}</span></label>}
        {perks.length === 0 && <p className="rounded-xl border border-dashed border-sky-border p-4 text-center text-sm text-mute">{t("No specials yet. Add a discount, free delivery or any other special for this level.")}</p>}
        {perks.map((p, i) => (<div key={p.id ?? i} className="space-y-3 rounded-2xl border border-sky-border bg-[#F6FAFF] p-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={lab}>{t("Type")}<select value={p.kind} onChange={(e) => setPerk(i, { kind: e.target.value as PerkKind })} className={`${field} mt-1`}>{(Object.keys(KIND_NAME) as PerkKind[]).map((k) => <option key={k} value={k}>{t(KIND_NAME[k])}</option>)}</select></label>
            {p.kind === "custom" ? <label className={lab}>{t("What the member gets")}<input value={p.title} onChange={(e) => setPerk(i, { title: e.target.value })} required minLength={2} maxLength={60} placeholder="e.g. Birthday gift" className={`${field} mt-1`} /></label>
              : <p className="self-end rounded-xl border border-dashed border-sky-border px-3.5 py-2.5 text-sm text-mute">{t("Shown to the customer as: {name}", { name: specialName.trim() || name.trim() || t("Level name") })}</p>}</div>
          {p.kind === "custom" && <div className="space-y-3">
            <label className={lab}>{t("Details (optional)")}<textarea value={p.detail} onChange={(e) => setPerk(i, { detail: e.target.value })} maxLength={300} rows={3} placeholder="e.g. Pick 1 free toy from the gift shelf. Tell us when you order." className={`${field} mt-1`} /><span className="mt-1 block text-xs font-normal text-mute">{t("Explain the special to the member (up to 300 characters). They see this in My membership.")}</span></label>
            <div className="rounded-xl border border-sky-border bg-white p-3"><p className="mb-2 text-sm font-bold">{t("Picture (optional)")}</p><ImageUpload value={p.image} path="/admin/promotions/image" onChange={(v) => setPerk(i, { image: v })} hint={t("For example a photo of the free product. Shown to the member next to this special.")} /></div></div>}
          {p.kind !== "custom" && <div className="grid gap-3 sm:grid-cols-2">
            {p.kind === "percent" && <label className={lab}>{t("Discount %")}<input type="number" min="1" max="90" step="1" value={p.percent} onChange={(e) => setPerk(i, { percent: e.target.value })} required className={`${field} mt-1`} /></label>}
            {p.kind === "amount" && <label className={lab}>{t("Discount amount (USD)")}<input type="number" min="0.01" step="0.01" value={p.amount} onChange={(e) => setPerk(i, { amount: e.target.value })} required className={`${field} mt-1`} /></label>}
            <label className={lab}>{t("Minimum order (USD, optional)")}<input type="number" min="0" step="0.01" value={p.minSpend} onChange={(e) => setPerk(i, { minSpend: e.target.value })} placeholder="0" className={`${field} mt-1`} /></label></div>}
          <label className={lab}>{t("Limit per member each month")}<input type="number" min="0" max="999" step="1" value={p.monthlyLimit} onChange={(e) => setPerk(i, { monthlyLimit: e.target.value })} placeholder={t("0 = no limit")} className={`${field} mt-1`} /><span className="mt-1 block text-xs font-normal text-mute">{t("How many times one member can use this special in a calendar month. It starts again on the 1st.")}</span></label>
          {(p.kind === "percent" || p.kind === "amount") && <label className="flex items-start gap-2 rounded-xl border border-sky-border bg-white px-3.5 py-2.5 text-sm font-bold"><input type="checkbox" checked={p.onPromo} onChange={(e) => setPerk(i, { onPromo: e.target.checked })} className="mt-0.5 h-4 w-4" /><span>{t("Also works on discounted and promotion products")}<span className="block text-xs font-normal text-mute">{t("On: members get this special on top of sale prices, category / product discounts and festival offers. Off: only on full-price products.")}</span></span></label>}
          <div className="flex items-center justify-between gap-3 text-sm font-bold"><label className="flex items-center gap-2"><input type="checkbox" checked={p.active} onChange={(e) => setPerk(i, { active: e.target.checked })} className="h-4 w-4" />{t("Switched on")}</label>
            <button type="button" onClick={() => setPerks((l) => l.filter((_, j) => j !== i))} className="text-[#E0456B] hover:underline">{t("Delete special")}</button></div></div>))}</div>
      {err && <p role="alert" className="rounded-xl bg-red-100 p-3 text-sm">{err}</p>}
      <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={close} className="rounded-full border border-sky-border bg-white px-6 py-2.5 font-bold hover:bg-sky-pale">{t("Cancel")}</button>
        <button disabled={busy} className="rounded-full bg-sky px-8 py-2.5 font-extrabold shadow-soft hover:bg-sky-hover disabled:opacity-50">{busy ? t("Saving…") : t("Save level")}</button></div></form>)}</Modal>);
}

type MemberRow = { points: number; pointsSpent: number; pointsAuto: number; pointsBonus: number; pointLog: { at: string; delta: number; note: string }[]; email: string; name: string; phone: string; avatar: string; address: string; facebook: string; telegram: string; spendCents: number; orders: number; lastOrderAt: string; autoTierId: string | null; tierId: string | null; forcedTierId: string | null; blocked: boolean; removed: boolean; used: Record<string, number> };
const pill = "rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide";
/** Customer memberships table: level, total paid, points; Manage opens the level / specials / profile controls. */
function MembersSection({ tiers, onMsg }: { tiers: Tier[]; onMsg: (m: Msg) => void }) {
  const { t } = useI18n(); const { data } = useAdmin<{ members: MemberRow[] }>("/admin/members"); const [q, setQ] = useState(""); const [open, setOpen] = useState<string | null>(null); const [showGone, setShowGone] = useState(false);
  const [adding, setAdding] = useState(false); const [af, setAf] = useState({ email: "", name: "", phone: "", tierId: "" }); const [busy, setBusy] = useState(false); const [pf, setPf] = useState({ points: "", note: "" });
  if (!data) return <Skeleton />;
  const addPoints = async (m: MemberRow, e: FormEvent) => { e.preventDefault(); if (busy) return; setBusy(true); const r = await send("/admin/members/points", { email: m.email, points: Number(pf.points), note: pf.note }, "Points updated"); setBusy(false); onMsg(r); if (r.ok) setPf({ points: "", note: "" }); };
  const addMember = async (e: FormEvent) => { e.preventDefault(); if (busy) return; setBusy(true); const r = await send("/admin/members/add", af, "Member added"); setBusy(false); onMsg(r); if (r.ok) { setAf({ email: "", name: "", phone: "", tierId: af.tierId }); } };
  const needle = q.trim().toLowerCase(); const rows = data.members.filter((m) => (showGone || !m.removed) && `${m.name} ${m.email} ${m.phone}`.toLowerCase().includes(needle)); const tierOf = (id: string | null) => tiers.find((x) => x.id === id) ?? null;
  const set = async (m: MemberRow, patch: { tierId?: string; blocked?: boolean; removed?: boolean }) => onMsg(await send("/admin/members/set", { email: m.email, tierId: m.forcedTierId ?? "", blocked: m.blocked, removed: m.removed, ...patch }, "Member saved"));
  const cols = "sm:grid-cols-[minmax(0,2.2fr)_1fr_1fr_1fr_auto]";
  return (<section className={card}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex flex-wrap items-center gap-2 text-xl font-extrabold">{t("Customer Memberships")} <span className={`${pill} bg-[#E8E6FF] text-[#5B3FC8]`}>{t("Admin access")}</span></h2>
      <p className="text-sm text-mute">{t("See every member, their level and what they used this month. You can set a level by hand or switch off a member's specials.")}</p></div>
      <p className="shrink-0 text-sm font-bold text-mute">{t("{n} customers", { n: data.members.length })}</p></div>
    <div className="mt-4 flex flex-wrap items-center gap-3"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search name, email or phone…")} aria-label={t("Search name, email or phone…")} className={`${field} !rounded-full sm:max-w-xs`} />
      <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={showGone} onChange={(e) => setShowGone(e.target.checked)} className="h-4 w-4" />{t("Show removed")}</label>
      <button type="button" onClick={() => setAdding((v) => !v)} aria-expanded={adding} className={`${outBtn} ml-auto`}>{adding ? t("Close") : `+ ${t("Add member")}`}</button></div>
    {adding && <form onSubmit={addMember} className="mt-3 grid gap-3 rounded-2xl border border-sky-border bg-[#F6FAFF] p-3.5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-end">
      <label className={lab}>{t("Email")}<input type="email" value={af.email} onChange={(e) => setAf({ ...af, email: e.target.value })} required maxLength={200} className={`${field} mt-1`} /></label>
      <label className={lab}>{t("Name")}<input value={af.name} onChange={(e) => setAf({ ...af, name: e.target.value })} maxLength={80} className={`${field} mt-1`} /></label>
      <label className={lab}>{t("Phone")}<input value={af.phone} onChange={(e) => setAf({ ...af, phone: e.target.value })} maxLength={30} className={`${field} mt-1`} /></label>
      <label className={lab}>{t("Level")}<select value={af.tierId} onChange={(e) => setAf({ ...af, tierId: e.target.value })} required className={`${field} mt-1`}><option value="">{t("Choose a level")}</option>{tiers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <button disabled={busy} className="btn-blue rounded-full px-6 py-2.5 font-extrabold disabled:opacity-50">{busy ? t("Saving…") : t("Add member")}</button>
      <p className="text-xs text-mute sm:col-span-2 lg:col-span-5">{t("Adds this person to membership at the level you choose. If they already have orders or an account, their level is set to it. They get that level's specials when they sign in with this email.")}</p></form>}
    <div className={`mt-4 hidden gap-3 border-b border-sky-border px-2 pb-2 text-[11px] font-extrabold uppercase tracking-wider text-mute sm:grid ${cols}`}><span>{t("Customer")}</span><span>{t("Tier")}</span><span className="text-right">{t("Lifetime spend")}</span><span className="text-right">{t("Points")}</span><span className="text-right">{t("Manage")}</span></div>
    {rows.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-sky-border p-5 text-center text-sm text-mute">{t("No members yet.")}</p>
      : <ul className="divide-y divide-sky-border">{rows.slice(0, 200).map((m) => { const tier = tierOf(m.tierId); const perks = (tier?.perks ?? []).filter((p) => p.active); return (<li key={m.email} className={`py-3 ${m.blocked ? "bg-red-50/60" : ""} ${m.removed ? "opacity-60" : ""}`}>
        <div className={`grid items-center gap-x-3 gap-y-2 px-2 ${cols}`}>
          <div className="flex min-w-0 items-center gap-3"><Avatar src={m.avatar} name={m.name || m.email} size={40} /><div className="min-w-0"><p className="truncate font-extrabold">{m.name || "—"} {m.removed && <span className={`${pill} ml-1 bg-slate-200 text-slate-600`}>{t("REMOVED")}</span>}{m.blocked && <span className={`${pill} ml-1 bg-red-100 text-red-700`}>{t("SPECIALS OFF")}</span>}</p><p className="truncate text-xs text-mute">{m.email}{m.phone ? ` · ${m.phone}` : ""}</p></div></div>
          <div><span className={`${pill} inline-flex items-center gap-1 bg-[#E8EEFF] text-[#4A56C8]`}>{tier ? tier.name : t("Not a member yet")}</span>{m.forcedTierId && <span className="ml-1 text-xs text-mute">({t("set by admin")})</span>}</div>
          <p className="font-mono text-sm font-bold sm:text-right">{usd(m.spendCents)}<span className="ml-2 text-xs font-normal text-mute sm:block sm:ml-0">{t("{n} orders", { n: m.orders })}</span></p>
          <p className="font-mono text-sm font-bold text-[#5B3FC8] sm:text-right">{m.points} pts</p>
          <div className="sm:text-right"><button type="button" onClick={() => setOpen(open === m.email ? null : m.email)} aria-expanded={open === m.email} className="btn-blue rounded-full px-4 py-1.5 text-sm font-extrabold">{open === m.email ? t("Close") : t("Manage")}</button></div></div>
        {open === m.email && <div className="mx-2 mt-3 space-y-3 rounded-2xl border border-sky-border bg-[#F6FAFF] p-3.5">
          <div className="flex items-start gap-3"><Avatar src={m.avatar} name={m.name || m.email} size={72} />
            <dl className="grid min-w-0 flex-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
              {([[t("Name"), m.name], [t("Email"), m.email], [t("Phone"), m.phone], [t("Telegram username"), m.telegram], [t("Facebook name"), m.facebook], [t("Address"), m.address]] as const).map(([k, v]) => <div key={k} className={k === t("Address") ? "sm:col-span-2" : ""}><dt className="text-xs font-extrabold uppercase tracking-wide text-mute">{k}</dt><dd className="break-words font-semibold">{v || "—"}</dd></div>)}</dl></div>
          <div className="grid gap-3 sm:grid-cols-2"><label className={lab}>{t("Level")}<select value={m.forcedTierId ?? ""} onChange={(e) => void set(m, { tierId: e.target.value })} className={`${field} mt-1`}><option value="">{t("Automatic (from what they paid)")}</option>{tiers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
            <label className="flex items-center gap-2 self-end rounded-xl border border-sky-border bg-white px-3.5 py-2.5 text-sm font-bold"><input type="checkbox" checked={m.blocked} onChange={(e) => void set(m, { blocked: e.target.checked })} className="h-4 w-4" />{t("Switch off this member's specials")}</label></div>
          <form onSubmit={(e) => void addPoints(m, e)} className="space-y-2 rounded-2xl border border-sky-border bg-white p-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-mute">{t("Points")}: <b className="text-[#5B3FC8]">{m.points} pts</b> <span className="font-semibold normal-case">({t("{a} earned from orders", { a: m.pointsAuto })} · {t("{b} added by admin", { b: m.pointsBonus })} · {t("{s} spent on gifts", { s: m.pointsSpent })})</span></p>
            <div className="grid gap-2 sm:grid-cols-[8rem_1fr_auto]"><input type="number" step="1" value={pf.points} onChange={(e) => setPf({ ...pf, points: e.target.value })} required placeholder={t("e.g. 20 or -5")} aria-label={t("Points to add")} className={`${field} font-mono`} />
              <input value={pf.note} onChange={(e) => setPf({ ...pf, note: e.target.value })} maxLength={80} placeholder={t("Note (optional), e.g. Birthday bonus")} aria-label={t("Note")} className={field} />
              <button disabled={busy} className="btn-blue rounded-full px-5 py-2.5 font-extrabold disabled:opacity-50">{t("Add points")}</button></div>
            <p className="text-xs text-mute">{t("Adds extra points on top of the points the member earns automatically. Use a minus number to take points off.")}</p>
            {m.pointLog.length > 0 && <ul className="space-y-0.5 text-xs text-mute">{m.pointLog.slice(0, 5).map((l, i) => <li key={i}><b className={l.delta > 0 ? "text-green-700" : "text-red-700"}>{l.delta > 0 ? "+" : ""}{l.delta}</b> · {new Date(l.at).toLocaleDateString()}{l.note ? ` · ${l.note}` : ""}</li>)}</ul>}</form>
          <div className="flex gap-4 text-sm font-bold">{m.removed ? <button type="button" onClick={() => void set(m, { removed: false })} className="text-sky-hover hover:underline">{t("Restore member")}</button> : <button type="button" onClick={() => { if (confirm(`Remove ${m.name} from membership? They lose their level and specials. Their orders are kept.`)) void set(m, { removed: true }); }} className="text-[#E0456B] hover:underline">{t("Delete member")}</button>}</div>
          {perks.length > 0 ? <div><p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-mute">{t("Used this month")}</p><ul className="flex flex-wrap gap-2 text-sm">{perks.map((p) => { const n = m.used[p.id] ?? 0, full = p.monthlyLimit > 0 && n >= p.monthlyLimit; return <li key={p.id} className={`rounded-full border px-3 py-1 font-bold ${full ? "border-red-200 bg-red-50 text-red-700" : "border-sky-border bg-white"}`}>{perkName(p, t)}: {n}{p.monthlyLimit > 0 ? ` / ${p.monthlyLimit}` : ""}</li>; })}</ul></div> : <p className="text-sm text-mute">{t("No specials yet.")}</p>}</div>}</li>); })}</ul>}
    {rows.length > 200 && <p className="mt-2 text-center text-xs text-mute">{t("Showing the first 200. Use search to find others.")}</p>}</section>);
}

const perkLine = (p: Perk, t: (s: string, v?: Record<string, string | number>) => string) => `${p.minSpendCents ? `${t("Min {n}", { n: usd(p.minSpendCents) })} · ` : ""}${p.kind === "percent" || p.kind === "amount" ? (p.onPromo ? t("Works on sale items") : t("Full-price only")) : ""}${p.monthlyLimit > 0 ? ` · ${t("{n}/month", { n: p.monthlyLimit })}` : p.kind !== "custom" ? ` · ${t("Unlimited/month")}` : ""}`.replace(/^ · /, "");

export default function Membership() {
  useTitle("Membership"); const { t } = useI18n(); const { data } = useAdmin<{ promotions: Promotions }>("/admin/promotions"); const { data: mem } = useAdmin<{ members: MemberRow[] }>("/admin/members");
  const [edit, setEdit] = useState<Tier | "new" | null>(null); const [msg, setMsg] = useState<Msg>(null);
  if (!data) return <Skeleton />;
  const tiers = data.promotions.membership, pointCents = data.promotions.memberPointCents; const act = async (path: string, body: object, ok: string) => setMsg(await send(path, body, ok));
  const live = (mem?.members ?? []).filter((m) => !m.removed); const enrolled = live.filter((m) => m.tierId).length; const perkCount = tiers.reduce((n, x) => n + x.perks.length, 0);
  const stats: [string, string, string, string, string][] = [[t("Active Tiers"), String(tiers.filter((x) => x.active).length), "🏅", "#FFE3EE", "#E0456B"], [t("Configured Perks"), String(perkCount), "🏷️", "#FFF1C9", "#C98A12"], [t("Enrolled Members"), mem ? `${enrolled} / ${live.length}` : "…", "👥", "#EEE3FF", "#7A4FD0"], [t("Points Rate"), `${usd(pointCents)}/pt`, "🪙", "#D9F6E6", "#2F8F5B"]];
  return (<div className="space-y-5">
    {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-xl p-3 text-sm ${msg.ok ? "bg-green-100" : "bg-red-100"}`}>{t(msg.text)}</p>}
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-sky-border bg-gradient-to-r from-white via-[#F3F9FF] to-[#E6F1FF] p-5 shadow-soft sm:p-6">
      <div className="min-w-0 max-w-2xl"><h1 className="flex items-center gap-2 text-xl font-extrabold text-[#3A3FA8]"><span aria-hidden="true">✨</span>{t("Automatic Membership & Loyalty Rules")}</h1>
        <p className="mt-1 text-sm text-mute">{t("Customers move up automatically as their paid orders add up. Each level has its own specials. You can edit or delete anything here.")}</p>
        <Link to="/admin/settings#membership-banner" className="mt-2 inline-block text-sm font-extrabold text-[#4A86D8] hover:underline">🖼 {t("Membership page banner (cover picture)")} · {t("Change picture")} →</Link></div>
      <button type="button" onClick={() => setEdit("new")} className="btn-blue shrink-0 rounded-full px-6 py-3 font-extrabold">+ {t("Add Membership Level")}</button></section>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([label, value, ico, bg, fg]) => (<div key={label} className={statBox}><span aria-hidden="true" style={{ background: bg, color: fg }} className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-xl">{ico}</span><div className="min-w-0"><p className="truncate text-xs font-semibold text-mute">{label}</p><p className="truncate text-2xl font-extrabold">{value}</p></div></div>))}</div>
    {tiers.length === 0 ? <p className="rounded-3xl border border-dashed border-sky-border bg-white p-6 text-center text-sm text-mute">{t("No membership levels. Add one and customers reach it automatically.")}</p>
      : <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{tiers.map((x, i) => { const specials = x.perks.filter((p) => p.active); return (<li key={x.id} className={`flex flex-col rounded-3xl border border-sky-border bg-white p-5 shadow-soft ${x.active ? "" : "opacity-70"}`}>
        <div className="flex items-start justify-between gap-2"><div className="flex min-w-0 items-center gap-3"><TierBadge tier={x} size={44} /><div className="min-w-0"><button type="button" aria-pressed={x.active} title={x.active ? t("Click to pause") : t("Click to activate")} onClick={() => act("/admin/promotions/membership/toggle", { id: x.id, active: !x.active }, x.active ? "Level paused" : "Level activated")} className={`${pill} ${x.active ? "bg-[#DDF6E8] text-[#2F8F5B]" : "bg-slate-200 text-slate-600"}`}>{x.active ? t("ACTIVE") : t("PAUSED")}</button><p className="truncate text-xl font-extrabold text-[#2B2F6B]">{x.name}</p></div></div><span className="rounded-full bg-sky-pale px-2 py-0.5 text-xs font-bold text-mute">#{i + 1}</span></div>
        <div className="mt-3 border-t border-sky-border pt-3"><p className="text-[11px] font-extrabold uppercase tracking-wider text-mute">{t("Unlock requirement")}</p>
          <p className="mt-1 font-bold">{i === 0 ? t("From {n} paid", { n: usd(x.minSpendCents) }) : t("One order of {n} or more after {name}", { n: usd(x.singleOrderCents), name: tiers[i - 1]?.name ?? "" })}</p><p className="text-xs text-mute">{t("Product spend only (delivery excluded)")}</p></div>
        <div className="mt-3 flex-1 border-t border-sky-border pt-3"><p className="text-[11px] font-extrabold uppercase tracking-wider text-mute">{t("Active specials")} ({specials.length})</p>
          {specials.length === 0 ? <p className="mt-2 text-sm text-mute">{t("No specials yet.")}</p> : <ul className="mt-2 space-y-2">{specials.map((p) => <li key={p.id} className="rounded-2xl bg-[#EEF4FF] px-3 py-2 text-sm">{p.kind === "custom" && p.image && <img src={p.image} alt="" className="mr-2 inline-block h-7 w-7 rounded-lg object-cover align-middle" />}<b className="text-[#4A3FC8]">{perkName(p, t)}</b>{p.kind === "custom" && p.detail && <span className="block text-xs text-mute">{p.detail}</span>}<span className="block text-xs text-mute">{p.kind === "custom" && !p.monthlyLimit ? t("Active on every order") : perkLine(p, t)}</span></li>)}</ul>}</div>
        <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setEdit(x)} className={outBtn}>✎ {t("Edit")}</button>
          <button type="button" onClick={() => { if (confirm(`Delete the level "${x.name}" and its specials? Customers at this level move down to the level below.`)) void act("/admin/promotions/membership/delete", { id: x.id }, "Level deleted"); }} className={`${outBtn} text-[#C0334F]`}>🗑 {t("Delete")}</button>
          <button type="button" disabled={i === 0} onClick={() => void act("/admin/promotions/membership/move", { id: x.id, dir: "down" }, "Level moved")} className="rounded-full bg-sky-pale px-3 py-2 text-xs font-bold text-mute hover:bg-[#DCEEFF] disabled:opacity-40">← {t("Move down")}</button>
          <button type="button" disabled={i === tiers.length - 1} onClick={() => void act("/admin/promotions/membership/move", { id: x.id, dir: "up" }, "Level moved")} className="rounded-full bg-sky-pale px-3 py-2 text-xs font-bold text-ink hover:bg-[#DCEEFF] disabled:opacity-40">{t("Move up")} →</button></div></li>); })}</ul>}
    <section className={card}><form onSubmit={async (e) => { e.preventDefault(); void act("/admin/promotions/membership/points", { pointDollars: new FormData(e.currentTarget).get("pointDollars") }, "Saved"); }} key={pointCents} className="flex flex-wrap items-end justify-between gap-3">
      <label className={lab}>{t("Dollars paid for 1 point (USD)")}<input name="pointDollars" type="number" min="1" step="0.01" defaultValue={pointCents / 100} required className={`${field} mt-1 w-48 font-mono`} /></label>
      <button className="btn-blue rounded-full px-7 py-3 font-extrabold">{t("Save Points Rules")}</button></form>
      <p className="mt-3 border-t border-sky-border pt-3 text-xs text-mute">{t("Points start counting after a customer reaches the first level. The first {n} they pay to join does not give points. Delivery is not counted. Customers spend points on the gifts below.", { n: tiers[0] ? usd(tiers[0].minSpendCents) : "$30" })}</p></section>
    <MembersSection tiers={tiers} onMsg={setMsg} />
    <GiftsSection onMsg={setMsg} />
    {edit && <TierModal key={edit === "new" ? "new" : edit.id} tiers={tiers} tier={edit === "new" ? undefined : edit} onClose={() => setEdit(null)} onDone={setMsg} />}
  </div>);
}
