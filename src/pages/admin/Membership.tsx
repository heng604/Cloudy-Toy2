import { useState, type FormEvent } from "react";
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
const card = "rounded-3xl bg-white p-5 shadow-soft sm:p-6";
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

type MemberRow = { points: number; pointsSpent: number; email: string; name: string; phone: string; avatar: string; address: string; facebook: string; telegram: string; spendCents: number; orders: number; lastOrderAt: string; autoTierId: string | null; tierId: string | null; forcedTierId: string | null; blocked: boolean; removed: boolean; used: Record<string, number> };
/** Every member: level, total paid, this month's use of each special; the admin can fix a level or switch a member's specials off. */
function MembersSection({ tiers, onMsg }: { tiers: Tier[]; onMsg: (m: Msg) => void }) {
  const { t } = useI18n(); const { data } = useAdmin<{ members: MemberRow[] }>("/admin/members"); const [q, setQ] = useState(""); const [open, setOpen] = useState<string | null>(null); const [showGone, setShowGone] = useState(false);
  const [adding, setAdding] = useState(false); const [af, setAf] = useState({ email: "", name: "", phone: "", tierId: "" }); const [busy, setBusy] = useState(false);
  if (!data) return <Skeleton />;
  const addMember = async (e: FormEvent) => { e.preventDefault(); if (busy) return; setBusy(true); const r = await send("/admin/members/add", af, "Member added"); setBusy(false); onMsg(r); if (r.ok) { setAf({ email: "", name: "", phone: "", tierId: af.tierId }); } };
  const needle = q.trim().toLowerCase(); const rows = data.members.filter((m) => (showGone || !m.removed) && `${m.name} ${m.email} ${m.phone}`.toLowerCase().includes(needle)); const tierOf = (id: string | null) => tiers.find((x) => x.id === id) ?? null;
  const set = async (m: MemberRow, patch: { tierId?: string; blocked?: boolean; removed?: boolean }) => onMsg(await send("/admin/members/set", { email: m.email, tierId: m.forcedTierId ?? "", blocked: m.blocked, removed: m.removed, ...patch }, "Member saved"));
  return (<section className={card}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#E4F0FF] text-[#2F7FC6]"><Icon name="users" size={22} /></span><div><h2 className="text-lg font-extrabold">{t("All members")} <span className="text-sm font-semibold text-mute">({data.members.length})</span></h2><p className="text-sm text-mute">{t("See every member, their level and what they used this month. You can set a level by hand or switch off a member's specials.")}</p></div></div>
    <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={showGone} onChange={(e) => setShowGone(e.target.checked)} className="h-4 w-4" />{t("Show removed")}</label>
    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search name, email or phone…")} aria-label={t("Search name, email or phone…")} className={`${field} sm:max-w-xs`} /></div>
    <div className="mb-4"><button type="button" onClick={() => setAdding((v) => !v)} aria-expanded={adding} className="text-sm font-extrabold text-[#E0456B] hover:underline">{adding ? t("Close") : `+ ${t("Add member")}`}</button>
      {adding && <form onSubmit={addMember} className="mt-3 grid gap-3 rounded-2xl border border-sky-border bg-[#F6FAFF] p-3.5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-end">
        <label className={lab}>{t("Email")}<input type="email" value={af.email} onChange={(e) => setAf({ ...af, email: e.target.value })} required maxLength={200} className={`${field} mt-1`} /></label>
        <label className={lab}>{t("Name")}<input value={af.name} onChange={(e) => setAf({ ...af, name: e.target.value })} maxLength={80} className={`${field} mt-1`} /></label>
        <label className={lab}>{t("Phone")}<input value={af.phone} onChange={(e) => setAf({ ...af, phone: e.target.value })} maxLength={30} className={`${field} mt-1`} /></label>
        <label className={lab}>{t("Level")}<select value={af.tierId} onChange={(e) => setAf({ ...af, tierId: e.target.value })} required className={`${field} mt-1`}><option value="">{t("Choose a level")}</option>{tiers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <button disabled={busy} className="rounded-full bg-sky px-6 py-2.5 font-extrabold shadow-soft hover:bg-sky-hover disabled:opacity-50">{busy ? t("Saving…") : t("Add member")}</button>
        <p className="text-xs text-mute sm:col-span-2 lg:col-span-5">{t("Adds this person to membership at the level you choose. If they already have orders or an account, their level is set to it. They get that level's specials when they sign in with this email.")}</p></form>}</div>
    {rows.length === 0 ? <p className="rounded-xl border border-dashed border-sky-border p-5 text-center text-sm text-mute">{t("No members yet.")}</p>
      : <ul className="space-y-2">{rows.slice(0, 200).map((m) => { const tier = tierOf(m.tierId); const perks = (tier?.perks ?? []).filter((p) => p.active); return (<li key={m.email} className={`rounded-2xl border border-sky-border p-3 ${m.blocked ? "bg-red-50" : ""} ${m.removed ? "opacity-60" : ""}`}>
        <div className="flex flex-wrap items-center gap-3"><Avatar src={m.avatar} name={m.name || m.email} size={48} /><TierBadge tier={tier} size={40} /><div className="min-w-0 flex-1"><p className="truncate font-extrabold">{m.name} {m.removed && <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-extrabold text-slate-600">{t("REMOVED")}</span>}{m.blocked && <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-extrabold text-red-700">{t("SPECIALS OFF")}</span>}</p><p className="truncate text-xs text-mute">{m.email} · {m.phone}</p></div>
          <div className="text-right text-sm"><p className="font-extrabold text-[#7A4FD0]">{tier ? tier.name : t("Not a member yet")}{m.forcedTierId && <span className="ml-1 text-xs font-semibold text-mute">({t("set by admin")})</span>}</p><p className="text-xs text-mute">{usd(m.spendCents)} · {t("{n} orders", { n: m.orders })} · <b className="text-[#5B3FC8]">{m.points} pts</b></p></div>
          <button type="button" onClick={() => setOpen(open === m.email ? null : m.email)} aria-expanded={open === m.email} className="text-sm font-extrabold text-sky-hover hover:underline">{open === m.email ? t("Close") : t("Manage")}</button></div>
        {open === m.email && <div className="mt-3 space-y-3 border-t border-sky-border pt-3">
          <div className="flex items-start gap-3 rounded-2xl bg-[#F6FAFF] p-3"><Avatar src={m.avatar} name={m.name || m.email} size={72} />
            <dl className="grid min-w-0 flex-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
              {([[t("Name"), m.name], [t("Email"), m.email], [t("Phone"), m.phone], [t("Telegram username"), m.telegram], [t("Facebook name"), m.facebook], [t("Address"), m.address]] as const).map(([k, v]) => <div key={k} className={k === t("Address") ? "sm:col-span-2" : ""}><dt className="text-xs font-extrabold uppercase tracking-wide text-mute">{k}</dt><dd className="break-words font-semibold">{v || "—"}</dd></div>)}</dl></div>
          <div className="grid gap-3 sm:grid-cols-2"><label className={lab}>{t("Level")}<select value={m.forcedTierId ?? ""} onChange={(e) => void set(m, { tierId: e.target.value })} className={`${field} mt-1`}><option value="">{t("Automatic (from what they paid)")}</option>{tiers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
            <label className="flex items-center gap-2 self-end rounded-xl border border-sky-border bg-white px-3.5 py-2.5 text-sm font-bold"><input type="checkbox" checked={m.blocked} onChange={(e) => void set(m, { blocked: e.target.checked })} className="h-4 w-4" />{t("Switch off this member's specials")}</label></div>
          <div className="flex gap-4 text-sm font-bold">{m.removed ? <button type="button" onClick={() => void set(m, { removed: false })} className="text-sky-hover hover:underline">{t("Restore member")}</button> : <button type="button" onClick={() => { if (confirm(`Remove ${m.name} from membership? They lose their level and specials. Their orders are kept.`)) void set(m, { removed: true }); }} className="text-[#E0456B] hover:underline">{t("Delete member")}</button>}</div>
          {perks.length > 0 ? <div><p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-mute">{t("Used this month")}</p><ul className="flex flex-wrap gap-2 text-sm">{perks.map((p) => { const n = m.used[p.id] ?? 0, full = p.monthlyLimit > 0 && n >= p.monthlyLimit; return <li key={p.id} className={`rounded-full border px-3 py-1 font-bold ${full ? "border-red-200 bg-red-50 text-red-700" : "border-sky-border bg-sky-pale"}`}>{perkName(p, t)}: {n}{p.monthlyLimit > 0 ? ` / ${p.monthlyLimit}` : ""}</li>; })}</ul></div> : <p className="text-sm text-mute">{t("No specials yet.")}</p>}</div>}</li>); })}</ul>}
    {rows.length > 200 && <p className="mt-2 text-center text-xs text-mute">{t("Showing the first 200. Use search to find others.")}</p>}</section>);
}

export default function Membership() {
  useTitle("Membership"); const { t } = useI18n(); const { data } = useAdmin<{ promotions: Promotions }>("/admin/promotions");
  const [edit, setEdit] = useState<Tier | "new" | null>(null); const [msg, setMsg] = useState<Msg>(null);
  if (!data) return <Skeleton />;
  const tiers = data.promotions.membership, pointCents = data.promotions.memberPointCents; const act = async (path: string, body: object, ok: string) => setMsg(await send(path, body, ok));
  return (<div className="space-y-5">
    {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-xl p-3 text-sm ${msg.ok ? "bg-green-100" : "bg-red-100"}`}>{t(msg.text)}</p>}
    <section className={card}><div className="mb-4 flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF1D6] text-[#C98A12]"><Icon name="users" size={22} /></span><div><h1 className="text-lg font-extrabold">{t("Membership")}</h1>
      <p className="text-sm text-mute">{t("Customers move up automatically as their paid orders add up. Each level has its own specials. You can edit or delete anything here.")}</p></div></div>
      <button type="button" onClick={() => setEdit("new")} className="shrink-0 text-sm font-extrabold text-[#E0456B] hover:underline">+ {t("Add level")}</button></div>
      {tiers.length === 0 ? <p className="rounded-xl border border-dashed border-sky-border p-5 text-center text-sm text-mute">{t("No membership levels. Add one and customers reach it automatically.")}</p>
        : <ul className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{tiers.map((x) => (<li key={x.id} className={`space-y-2 rounded-2xl border border-sky-border p-4 ${x.active ? "" : "opacity-60"}`}>
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><TierBadge tier={x} size={40} /><p className="truncate text-lg font-extrabold">{x.name}</p></div><p className="text-sm font-bold text-[#7A4FD0]">{x.id === tiers[0].id ? t("From {n} paid", { n: usd(x.minSpendCents) }) : t("One order of {n} or more after {name}", { n: usd(x.singleOrderCents), name: tiers[tiers.findIndex((y) => y.id === x.id) - 1]?.name ?? "" })}</p></div>
            <button type="button" aria-pressed={x.active} title={x.active ? t("Click to pause") : t("Click to activate")} onClick={() => act("/admin/promotions/membership/toggle", { id: x.id, active: !x.active }, x.active ? "Level paused" : "Level activated")} className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${x.active ? "bg-[#DDF6E8] text-[#2F8F5B]" : "bg-slate-200 text-slate-600"}`}>{x.active ? t("ACTIVE") : t("PAUSED")}</button></div>
          {x.perks.length === 0 ? <p className="text-sm text-mute">{t("No specials yet.")}</p> : <ul className="space-y-1 text-sm">{x.perks.map((p) => <li key={p.id} className={p.active ? "" : "text-mute line-through"}>{p.kind === "custom" && p.image && <img src={p.image} alt="" className="mr-2 inline-block h-8 w-8 rounded-lg object-cover align-middle" />}<b>{perkName(p, t)}</b>{p.kind === "custom" && p.detail && <span className="block text-xs text-mute">{p.detail}</span>}{p.kind === "custom" && p.monthlyLimit > 0 && <span className="text-mute"> · {t("max {n} a month", { n: p.monthlyLimit })}</span>}</li>)}</ul>}
          <div className="flex flex-wrap gap-4 pt-1 text-sm font-bold"><button type="button" onClick={() => setEdit(x)} className="text-sky-hover hover:underline">{t("Edit")}</button>
            <button type="button" onClick={() => { if (confirm(`Delete the level "${x.name}" and its specials? Customers at this level move down to the level below.`)) void act("/admin/promotions/membership/delete", { id: x.id }, "Level deleted"); }} className="text-[#E0456B] hover:underline">{t("Delete")}</button>
            {tiers.indexOf(x) > 0 && <button type="button" onClick={() => void act("/admin/promotions/membership/move", { id: x.id, dir: "down" }, "Level moved")} className="text-mute hover:underline">← {t("Move down")}</button>}
            {tiers.indexOf(x) < tiers.length - 1 && <button type="button" onClick={() => void act("/admin/promotions/membership/move", { id: x.id, dir: "up" }, "Level moved")} className="text-mute hover:underline">{t("Move up")} →</button>}</div></li>))}</ul>}
</section>
    <section className={`${card} space-y-2`}><form onSubmit={async (e) => { e.preventDefault(); void act("/admin/promotions/membership/points", { pointDollars: new FormData(e.currentTarget).get("pointDollars") }, "Saved"); }} key={pointCents} className="flex flex-wrap items-end gap-3">
      <label className={lab}>{t("Dollars paid for 1 point (USD)")}<input name="pointDollars" type="number" min="1" step="0.01" defaultValue={pointCents / 100} required className={`${field} mt-1 w-40`} /></label>
      <button className="rounded-full bg-sky px-6 py-2.5 font-extrabold shadow-soft hover:bg-sky-hover">{t("Save")}</button></form>
      <p className="text-xs text-mute">{t("Points start counting after a customer reaches the first level. The first {n} they pay to join does not give points. Delivery is not counted. Customers spend points on the gifts below.", { n: tiers[0] ? usd(tiers[0].minSpendCents) : "$30" })}</p></section>
    <GiftsSection onMsg={setMsg} />
    <MembersSection tiers={tiers} onMsg={setMsg} />
    {edit && <TierModal key={edit === "new" ? "new" : edit.id} tiers={tiers} tier={edit === "new" ? undefined : edit} onClose={() => setEdit(null)} onDone={setMsg} />}
  </div>);
}
