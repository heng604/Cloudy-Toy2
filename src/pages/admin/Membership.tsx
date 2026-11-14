import { useState, type FormEvent } from "react";
import Icon from "@/components/admin/Icons";
import Modal from "@/components/admin/Modal";
import Skeleton from "@/components/Skeleton";
import ImageUpload from "@/components/admin/ImageUpload";
import TierBadge from "@/components/TierBadge";
import { post } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useTitle } from "@/lib/title";
import { MAX_PERKS, perkDetail, type Perk, type PerkKind, type Tier } from "@shared/membership";
import type { Promotions } from "@shared/promotions";
import { useAdmin, refreshAdmin } from "./hooks";
type Msg = { ok: boolean; text: string } | null;
const field = "w-full rounded-xl border border-sky-border bg-[#F3F9FE] px-3.5 py-2.5 outline-none";
const lab = "block text-sm font-bold";
const card = "rounded-3xl bg-white p-5 shadow-soft sm:p-6";
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
const KIND_NAME: Record<PerkKind, string> = { percent: "% off every order", amount: "$ off every order", free_shipping: "Free delivery", custom: "Other special (written by you)" };
async function send(path: string, body: object, ok: string): Promise<{ ok: boolean; text: string }> {
  try { const j = await (await post(path, body)).json().catch(() => ({})) as { ok?: boolean; error?: string }; if (j.ok) { refreshAdmin(); return { ok: true, text: ok }; } return { ok: false, text: j.error ?? "Could not save. Please try again." }; }
  catch { return { ok: false, text: "Could not reach the server. Please try again." }; }
}
type PerkForm = { id?: string; kind: PerkKind; title: string; percent: string; amount: string; minSpend: string; active: boolean; monthlyLimit: string };
const toForm = (p: Perk): PerkForm => ({ id: p.id, kind: p.kind, title: p.title, percent: p.percent ? String(p.percent) : "", amount: p.amountCents ? String(p.amountCents / 100) : "", minSpend: p.minSpendCents ? String(p.minSpendCents / 100) : "", active: p.active, monthlyLimit: p.monthlyLimit ? String(p.monthlyLimit) : "" });
const blankPerk = (): PerkForm => ({ kind: "percent", title: "", percent: "5", amount: "", minSpend: "", active: true, monthlyLimit: "" });

function TierModal({ tier, onClose, onDone }: { tier?: Tier; onClose: () => void; onDone: (m: Msg) => void }) {
  const { t } = useI18n(); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [name, setName] = useState(tier?.name ?? ""), [emoji, setEmoji] = useState(tier?.emoji ?? "⭐"), [image, setImage] = useState(tier?.image ?? ""), [spend, setSpend] = useState(tier ? String(tier.minSpendCents / 100) : "");
  const [perks, setPerks] = useState<PerkForm[]>(tier ? tier.perks.map(toForm) : []);
  const setPerk = (i: number, patch: Partial<PerkForm>) => setPerks((l) => l.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  async function submit(e: FormEvent, close: () => void) {
    e.preventDefault(); if (busy) return; setBusy(true); setErr("");
    const r = await send("/admin/promotions/membership/save", { id: tier?.id, active: tier?.active ?? true, name, emoji, image, minSpend: spend, perks }, tier ? "Level saved" : "Level added");
    setBusy(false); if (!r.ok) { setErr(r.text); return; } onDone(r); close();
  }
  return (<Modal wide title={tier ? t("Edit membership level") : t("Add membership level")} icon="users" onClose={onClose}>{(close) => (
    <form onSubmit={(e) => submit(e, close)} className="space-y-4 p-5 sm:p-7">
      <div className="grid gap-3 sm:grid-cols-[1fr_6rem_1fr]">
        <label className={lab}>{t("Level name")}<input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={30} placeholder="e.g. Bronze" className={`${field} mt-1`} /></label>
        <label className={lab}>{t("Icon")}<input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={8} className={`${field} mt-1 text-center text-xl`} /></label>
        <label className={lab}>{t("Customer reaches it after paying (USD)")}<input type="number" min="1" step="0.01" value={spend} onChange={(e) => setSpend(e.target.value)} required placeholder="e.g. 70" className={`${field} mt-1`} /></label></div>
      <div className="rounded-2xl border border-sky-border bg-[#F6FAFF] p-3.5"><p className="mb-2 text-sm font-bold">{t("Level picture (optional)")}</p><ImageUpload value={image} path="/admin/promotions/image" onChange={setImage} hint={t("Shown to customers instead of the icon. Leave it empty to use the icon.")} /></div>
      <p className="text-xs text-mute">{t("A customer gets this level automatically when the total of their paid orders (delivery not counted) reaches this amount.")}</p>
      <div className="space-y-3"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-extrabold uppercase tracking-wide text-mute">{t("Specials for this level")}</h3>
        {perks.length < MAX_PERKS && <button type="button" onClick={() => setPerks((l) => [...l, blankPerk()])} className="text-sm font-extrabold text-[#E0456B] hover:underline">+ {t("Add special")}</button>}</div>
        {perks.length === 0 && <p className="rounded-xl border border-dashed border-sky-border p-4 text-center text-sm text-mute">{t("No specials yet. Add a discount, free delivery or any other special for this level.")}</p>}
        {perks.map((p, i) => (<div key={p.id ?? i} className="space-y-3 rounded-2xl border border-sky-border bg-[#F6FAFF] p-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={lab}>{t("Type")}<select value={p.kind} onChange={(e) => setPerk(i, { kind: e.target.value as PerkKind })} className={`${field} mt-1`}>{(Object.keys(KIND_NAME) as PerkKind[]).map((k) => <option key={k} value={k}>{t(KIND_NAME[k])}</option>)}</select></label>
            <label className={lab}>{t("Name shown to the customer")}<input value={p.title} onChange={(e) => setPerk(i, { title: e.target.value })} required minLength={2} maxLength={60} placeholder={p.kind === "custom" ? "e.g. Birthday gift" : "e.g. Member discount"} className={`${field} mt-1`} /></label></div>
          {p.kind !== "custom" && <div className="grid gap-3 sm:grid-cols-2">
            {p.kind === "percent" && <label className={lab}>{t("Discount %")}<input type="number" min="1" max="90" step="1" value={p.percent} onChange={(e) => setPerk(i, { percent: e.target.value })} required className={`${field} mt-1`} /></label>}
            {p.kind === "amount" && <label className={lab}>{t("Discount amount (USD)")}<input type="number" min="0.01" step="0.01" value={p.amount} onChange={(e) => setPerk(i, { amount: e.target.value })} required className={`${field} mt-1`} /></label>}
            <label className={lab}>{t("Minimum order (USD, optional)")}<input type="number" min="0" step="0.01" value={p.minSpend} onChange={(e) => setPerk(i, { minSpend: e.target.value })} placeholder="0" className={`${field} mt-1`} /></label></div>}
          <label className={lab}>{t("Limit per member each month")}<input type="number" min="0" max="999" step="1" value={p.monthlyLimit} onChange={(e) => setPerk(i, { monthlyLimit: e.target.value })} placeholder={t("0 = no limit")} className={`${field} mt-1`} /><span className="mt-1 block text-xs font-normal text-mute">{t("How many times one member can use this special in a calendar month. It starts again on the 1st.")}</span></label>
          <div className="flex items-center justify-between gap-3 text-sm font-bold"><label className="flex items-center gap-2"><input type="checkbox" checked={p.active} onChange={(e) => setPerk(i, { active: e.target.checked })} className="h-4 w-4" />{t("Switched on")}</label>
            <button type="button" onClick={() => setPerks((l) => l.filter((_, j) => j !== i))} className="text-[#E0456B] hover:underline">{t("Delete special")}</button></div></div>))}</div>
      {err && <p role="alert" className="rounded-xl bg-red-100 p-3 text-sm">{err}</p>}
      <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={close} className="rounded-full border border-sky-border bg-white px-6 py-2.5 font-bold hover:bg-sky-pale">{t("Cancel")}</button>
        <button disabled={busy} className="rounded-full bg-sky px-8 py-2.5 font-extrabold shadow-soft hover:bg-sky-hover disabled:opacity-50">{busy ? t("Saving…") : t("Save level")}</button></div></form>)}</Modal>);
}

type MemberRow = { email: string; name: string; phone: string; spendCents: number; orders: number; lastOrderAt: string; autoTierId: string | null; tierId: string | null; forcedTierId: string | null; blocked: boolean; removed: boolean; used: Record<string, number> };
/** Every member: level, total paid, this month's use of each special; the admin can fix a level or switch a member's specials off. */
function MembersSection({ tiers, onMsg }: { tiers: Tier[]; onMsg: (m: Msg) => void }) {
  const { t } = useI18n(); const { data } = useAdmin<{ members: MemberRow[] }>("/admin/members"); const [q, setQ] = useState(""); const [open, setOpen] = useState<string | null>(null); const [showGone, setShowGone] = useState(false);
  if (!data) return <Skeleton />;
  const needle = q.trim().toLowerCase(); const rows = data.members.filter((m) => (showGone || !m.removed) && `${m.name} ${m.email} ${m.phone}`.toLowerCase().includes(needle)); const tierOf = (id: string | null) => tiers.find((x) => x.id === id) ?? null;
  const set = async (m: MemberRow, patch: { tierId?: string; blocked?: boolean; removed?: boolean }) => onMsg(await send("/admin/members/set", { email: m.email, tierId: m.forcedTierId ?? "", blocked: m.blocked, removed: m.removed, ...patch }, "Member saved"));
  return (<section className={card}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#E4F0FF] text-[#2F7FC6]"><Icon name="users" size={22} /></span><div><h2 className="text-lg font-extrabold">{t("All members")} <span className="text-sm font-semibold text-mute">({data.members.length})</span></h2><p className="text-sm text-mute">{t("See every member, their level and what they used this month. You can set a level by hand or switch off a member's specials.")}</p></div></div>
    <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={showGone} onChange={(e) => setShowGone(e.target.checked)} className="h-4 w-4" />{t("Show removed")}</label>
    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search name, email or phone…")} aria-label={t("Search name, email or phone…")} className={`${field} sm:max-w-xs`} /></div>
    {rows.length === 0 ? <p className="rounded-xl border border-dashed border-sky-border p-5 text-center text-sm text-mute">{t("No members yet.")}</p>
      : <ul className="space-y-2">{rows.slice(0, 200).map((m) => { const tier = tierOf(m.tierId); const perks = (tier?.perks ?? []).filter((p) => p.active); return (<li key={m.email} className={`rounded-2xl border border-sky-border p-3 ${m.blocked ? "bg-red-50" : ""} ${m.removed ? "opacity-60" : ""}`}>
        <div className="flex flex-wrap items-center gap-3"><TierBadge tier={tier} size={40} /><div className="min-w-0 flex-1"><p className="truncate font-extrabold">{m.name} {m.removed && <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-extrabold text-slate-600">{t("REMOVED")}</span>}{m.blocked && <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-extrabold text-red-700">{t("SPECIALS OFF")}</span>}</p><p className="truncate text-xs text-mute">{m.email} · {m.phone}</p></div>
          <div className="text-right text-sm"><p className="font-extrabold text-[#7A4FD0]">{tier ? tier.name : t("Not a member yet")}{m.forcedTierId && <span className="ml-1 text-xs font-semibold text-mute">({t("set by admin")})</span>}</p><p className="text-xs text-mute">{usd(m.spendCents)} · {t("{n} orders", { n: m.orders })}</p></div>
          <button type="button" onClick={() => setOpen(open === m.email ? null : m.email)} aria-expanded={open === m.email} className="text-sm font-extrabold text-sky-hover hover:underline">{open === m.email ? t("Close") : t("Manage")}</button></div>
        {open === m.email && <div className="mt-3 space-y-3 border-t border-sky-border pt-3">
          <div className="grid gap-3 sm:grid-cols-2"><label className={lab}>{t("Level")}<select value={m.forcedTierId ?? ""} onChange={(e) => void set(m, { tierId: e.target.value })} className={`${field} mt-1`}><option value="">{t("Automatic (from what they paid)")}</option>{tiers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
            <label className="flex items-center gap-2 self-end rounded-xl border border-sky-border bg-white px-3.5 py-2.5 text-sm font-bold"><input type="checkbox" checked={m.blocked} onChange={(e) => void set(m, { blocked: e.target.checked })} className="h-4 w-4" />{t("Switch off this member's specials")}</label></div>
          <div className="flex gap-4 text-sm font-bold">{m.removed ? <button type="button" onClick={() => void set(m, { removed: false })} className="text-sky-hover hover:underline">{t("Restore member")}</button> : <button type="button" onClick={() => { if (confirm(`Remove ${m.name} from membership? They lose their level and specials. Their orders are kept.`)) void set(m, { removed: true }); }} className="text-[#E0456B] hover:underline">{t("Delete member")}</button>}</div>
          {perks.length > 0 ? <div><p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-mute">{t("Used this month")}</p><ul className="flex flex-wrap gap-2 text-sm">{perks.map((p) => { const n = m.used[p.id] ?? 0, full = p.monthlyLimit > 0 && n >= p.monthlyLimit; return <li key={p.id} className={`rounded-full border px-3 py-1 font-bold ${full ? "border-red-200 bg-red-50 text-red-700" : "border-sky-border bg-sky-pale"}`}>{p.title}: {n}{p.monthlyLimit > 0 ? ` / ${p.monthlyLimit}` : ""}</li>; })}</ul></div> : <p className="text-sm text-mute">{t("No specials yet.")}</p>}</div>}</li>); })}</ul>}
    {rows.length > 200 && <p className="mt-2 text-center text-xs text-mute">{t("Showing the first 200. Use search to find others.")}</p>}</section>);
}

export default function Membership() {
  useTitle("Membership"); const { t } = useI18n(); const { data } = useAdmin<{ promotions: Promotions }>("/admin/promotions");
  const [edit, setEdit] = useState<Tier | "new" | null>(null); const [msg, setMsg] = useState<Msg>(null);
  if (!data) return <Skeleton />;
  const tiers = data.promotions.membership; const act = async (path: string, body: object, ok: string) => setMsg(await send(path, body, ok));
  return (<div className="space-y-5">
    {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-xl p-3 text-sm ${msg.ok ? "bg-green-100" : "bg-red-100"}`}>{t(msg.text)}</p>}
    <section className={card}><div className="mb-4 flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF1D6] text-[#C98A12]"><Icon name="users" size={22} /></span><div><h1 className="text-lg font-extrabold">{t("Membership")}</h1>
      <p className="text-sm text-mute">{t("Customers move up automatically as their paid orders add up. Each level has its own specials. You can edit or delete anything here.")}</p></div></div>
      <button type="button" onClick={() => setEdit("new")} className="shrink-0 text-sm font-extrabold text-[#E0456B] hover:underline">+ {t("Add level")}</button></div>
      {tiers.length === 0 ? <p className="rounded-xl border border-dashed border-sky-border p-5 text-center text-sm text-mute">{t("No membership levels. Add one and customers reach it automatically.")}</p>
        : <ul className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{tiers.map((x) => (<li key={x.id} className={`space-y-2 rounded-2xl border border-sky-border p-4 ${x.active ? "" : "opacity-60"}`}>
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><TierBadge tier={x} size={40} /><p className="truncate text-lg font-extrabold">{x.name}</p></div><p className="text-sm font-bold text-[#7A4FD0]">{t("From {n} paid", { n: usd(x.minSpendCents) })}</p></div>
            <button type="button" aria-pressed={x.active} title={x.active ? t("Click to pause") : t("Click to activate")} onClick={() => act("/admin/promotions/membership/toggle", { id: x.id, active: !x.active }, x.active ? "Level paused" : "Level activated")} className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${x.active ? "bg-[#DDF6E8] text-[#2F8F5B]" : "bg-slate-200 text-slate-600"}`}>{x.active ? t("ACTIVE") : t("PAUSED")}</button></div>
          {x.perks.length === 0 ? <p className="text-sm text-mute">{t("No specials yet.")}</p> : <ul className="space-y-1 text-sm">{x.perks.map((p) => <li key={p.id} className={p.active ? "" : "text-mute line-through"}><b>{p.title}</b>{p.kind !== "custom" ? <span className="text-mute"> · {perkDetail(p, t)}</span> : p.monthlyLimit > 0 && <span className="text-mute"> · {t("max {n} a month", { n: p.monthlyLimit })}</span>}</li>)}</ul>}
          <div className="flex gap-4 pt-1 text-sm font-bold"><button type="button" onClick={() => setEdit(x)} className="text-sky-hover hover:underline">{t("Edit")}</button>
            <button type="button" onClick={() => { if (confirm(`Delete the level "${x.name}" and its specials? Customers at this level move down to the level below.`)) void act("/admin/promotions/membership/delete", { id: x.id }, "Level deleted"); }} className="text-[#E0456B] hover:underline">{t("Delete")}</button></div></li>))}</ul>}</section>
    <MembersSection tiers={tiers} onMsg={setMsg} />
    {edit && <TierModal key={edit === "new" ? "new" : edit.id} tier={edit === "new" ? undefined : edit} onClose={() => setEdit(null)} onDone={setMsg} />}
  </div>);
}
