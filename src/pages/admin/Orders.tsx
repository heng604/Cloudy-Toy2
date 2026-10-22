import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Link, useSearchParams } from "react-router-dom";
import { methodLabel, areaLabel } from "@shared/delivery";
import { filterOrders, sortOrders, summarize, usd, stamp } from "@shared/stats";
import { invoiceNo, firstName } from "@shared/invoice";
import type { StoredOrder } from "@shared/types";
import ExportButtons from "@/components/admin/ExportButtons";
import Skeleton from "@/components/Skeleton";
import { getSubmit } from "@/lib/forms";
import { post } from "@/lib/api";
import { useTitle } from "@/lib/title";
import { useAdmin, refreshAdmin } from "./hooks";
const hand = '"Caveat","Segoe Print","Bradley Hand","Comic Sans MS",cursive';
type Proofs = Record<string, string>;
type Tab = { id: string; label: string; icon: string };
const TABS: Tab[] = [{ id: "ALL", label: "All orders", icon: "🧸" }, { id: "CHECK", label: "Needs checking", icon: "👀" }, { id: "PENDING", label: "Waiting", icon: "⏳" }, { id: "PAID", label: "Paid", icon: "💙" }];
/** "5 min ago" style label, Phnom Penh clock is irrelevant here (relative time only). */
const ago = (iso: string, now = Date.now()) => { const m = Math.max(0, Math.round((now - Date.parse(iso)) / 60000)); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
/** Customer says they paid / uploaded a screenshot, but the admin has not confirmed yet. */
const needsCheck = (o: StoredOrder) => o.paymentStatus === "PENDING" && !!(o.claimedPaidAt || o.paymentProof);
const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, "")}`;
const link = (v: string | undefined, base: string) => !v ? "" : /^https?:\/\//.test(v) ? v : `${base}${v.replace(/^@/, "")}`;
const Chip = ({ children, cls }: { children: React.ReactNode; cls: string }) => <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold ${cls}`}>{children}</span>;
const MailPill = ({ label, s, detail }: { label: string; s: string; detail?: string }) => <span title={detail} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${s === "SENT" ? "bg-green-100 text-green-800" : s === "FAILED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}>{s === "SENT" ? "✓" : s === "FAILED" ? "✕" : "•"} {label}: {s.toLowerCase()}</span>;
export default function AdminOrders() {
  const { t } = useI18n(); useTitle(t("Orders"), true);
  const [sp, setSp] = useSearchParams(); const { data } = useAdmin<{ orders: StoredOrder[]; proofs: Proofs }>("/admin/orders?proofs=1");
  const [busy, setBusy] = useState(""); const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null); const [zoom, setZoom] = useState("");
  if (!data) return <Skeleton />;
  const tab = sp.get("status") ?? "ALL", q = sp.get("q") ?? undefined; const proofs = data.proofs ?? {};
  const f = { status: tab === "ALL" || tab === "CHECK" ? undefined : tab, q };
  const all = data.orders, s = summarize(all), checkN = all.filter(needsCheck).length;
  const orders = sortOrders(filterOrders(all, f), "new").filter((o) => tab !== "CHECK" || needsCheck(o));
  const counts: Record<string, string> = { ALL: `${s.count}`, CHECK: `${checkN}`, PENDING: `${s.pendingCount}`, PAID: `${s.paidCount}` };
  const setTab = (id: string) => { const p = new URLSearchParams(sp); if (id === "ALL") p.delete("status"); else p.set("status", id); setSp(p); };
  // every action reports success or the real reason it failed, instead of silently doing nothing
  const act = async (key: string, path: string, okText: string) => {
    setBusy(key); setMsg(null);
    try { const r = await post(path); const j = await r.json().catch(() => ({})) as { ok?: boolean; detail?: string; status?: string };
      if (r.ok && j.ok !== false && j.status !== "SKIPPED" && j.status !== "FAILED") setMsg({ ok: true, text: okText });
      else setMsg({ ok: false, text: `Could not do that${j.detail ? `: ${j.detail}` : j.status ? ` (${j.status.toLowerCase()})` : ` (server error ${r.status})`}.` });
    } catch { setMsg({ ok: false, text: "Network error. Please try again." }); }
    setBusy(""); refreshAdmin();
  };
  const markPaid = (o: StoredOrder) => { if (window.confirm(`Mark ${o.orderNumber} (${usd(o.totalCents)}) as PAID?\nOnly do this after you checked your ABA / bank app. The customer gets a “payment received” email.`)) void act(`paid:${o.orderNumber}`, `/admin/orders/${encodeURIComponent(o.orderNumber)}/mark-paid`, `${o.orderNumber} is paid. Receipt sent to the customer.`); };
  const pill = "rounded-full border border-sky-border bg-white px-4 py-2";
  const act2 = "inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-bold disabled:opacity-60";
  return (<div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-3xl leading-none sm:text-4xl" style={{ fontFamily: hand, fontWeight: 700 }}>Your little shop orders 🧸</p>
      <h1 className="mt-1 text-sm font-semibold text-mute">{t("Orders")} · {s.count} total · {usd(s.paidCents)} paid · {usd(s.pendingCents)} waiting</h1></div><ExportButtons type="orders" params={{ status: f.status, q }} /></div>

    <div role="tablist" aria-label="Order status" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {TABS.map((x) => { const on = tab === x.id; return <button key={x.id} role="tab" aria-selected={on} onClick={() => setTab(x.id)} className={`rounded-3xl p-4 text-left transition hover:-translate-y-0.5 ${on ? "bg-ink text-white shadow-lift" : "bg-white shadow-soft"} ${x.id === "CHECK" && checkN > 0 && !on ? "ring-2 ring-amber-300" : ""}`}>
        <span className="flex items-center justify-between"><span className="text-2xl" aria-hidden="true">{x.icon}</span><span className="text-3xl font-black leading-none">{counts[x.id]}</span></span>
        <span className={`mt-2 block text-sm font-bold ${on ? "text-white" : ""}`}>{x.label}</span>
        <span className={`block text-xs ${on ? "text-white/80" : "text-mute"}`}>{x.id === "PAID" ? usd(s.paidCents) : x.id === "PENDING" ? usd(s.pendingCents) : x.id === "ALL" ? usd(s.allCents) : "customer says paid"}</span></button>; })}
    </div>

    <form key={sp.toString()} onSubmit={getSubmit(setSp)} className="flex flex-wrap gap-2"><input name="q" defaultValue={q} placeholder="Search order, name, phone, email" className={`${pill} min-w-60 flex-1`} aria-label="Search orders" />
      {tab !== "ALL" && <input type="hidden" name="status" value={tab} />}
      <button className="rounded-full bg-sky px-5 py-2 font-bold hover:bg-sky-hover">{t("Filter")}</button><Link to="/admin/orders" className={pill}>{t("Reset")}</Link></form>

    {msg && <p role={msg.ok ? "status" : "alert"} className={`flex items-center justify-between gap-3 rounded-2xl p-3 text-sm font-semibold ${msg.ok ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}><span>{msg.ok ? "✓ " : "⚠ "}{msg.text}</span><button onClick={() => setMsg(null)} aria-label="Dismiss" className="rounded-full px-2 font-black">×</button></p>}
    {orders.length === 0 && <div className="rounded-3xl bg-white p-8 text-center shadow-soft"><p className="text-3xl" style={{ fontFamily: hand, fontWeight: 700 }}>No orders here yet ☁️</p><p className="text-sm text-mute">Try another tab or clear the search.</p></div>}

    <ul className="space-y-4">{orders.map((o) => {
      const c = o.customer, paid = o.paymentStatus === "PAID", check = needsCheck(o), proof = o.paymentProof ? proofs[o.paymentProof] : "";
      const accent = paid ? "bg-green-400" : check ? "bg-amber-400" : o.method === "COD" ? "bg-rose-300" : "bg-sky-hover";
      const tg = link(c.telegram, "https://t.me/"), fb = link(c.facebook, "https://facebook.com/");
      return <li key={o.orderNumber} className="relative overflow-hidden rounded-3xl bg-white p-4 pl-6 shadow-soft sm:p-5 sm:pl-7">
        <span className={`absolute inset-y-0 left-0 w-2.5 ${accent}`} aria-hidden="true" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sky-pale text-xl font-black uppercase text-ink ring-4 ring-white" aria-hidden="true">{firstName(c.name).charAt(0)}</span>
            <div className="min-w-0"><p className="truncate text-lg font-extrabold capitalize leading-tight">{c.name}</p>
              <p className="text-xs text-mute"><b className="text-ink">{o.orderNumber}</b> · {ago(o.createdAt)} · {stamp(o.createdAt)}</p></div></div>
          <div className="text-right"><p className="text-2xl font-black leading-none">{usd(o.totalCents)}</p>
            <div className="mt-1.5 flex flex-wrap justify-end gap-1.5">
              <Chip cls={paid ? "bg-green-100 text-green-800" : check ? "bg-amber-100 text-amber-900" : "bg-sky-pale text-ink"}>{paid ? "💙 PAID" : check ? "👀 CHECK PAYMENT" : "⏳ WAITING"}</Chip>
              <Chip cls="bg-rose-50 text-rose-800">{o.method === "COD" ? "🛵" : "📱"} {methodLabel(o.method)}</Chip></div></div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap gap-1.5">{o.items.map((i, n) => <span key={`${i.productId}-${n}`} className="rounded-full bg-sky-pale px-3 py-1 text-sm"><b>{i.qty}×</b> {i.name}</span>)}</div>
            <p className="text-sm text-mute">📍 {areaLabel(o)} · {c.address}</p>
            {c.notes && <p className="rounded-xl bg-[#FFFBEA] px-3 py-1.5 text-sm"><b>Note:</b> {c.notes}</p>}
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold"><a className="hover:underline" href={tel(c.phone)}>📞 {c.phone}</a>{c.email && <a className="hover:underline" href={`mailto:${c.email}`}>✉️ {c.email}</a>}{tg && <a className="hover:underline" href={tg} target="_blank" rel="noopener noreferrer">Telegram</a>}{fb && <a className="hover:underline" href={fb} target="_blank" rel="noopener noreferrer">Facebook</a>}</p>
            {check && o.claimedPaidAt && <p className="text-sm font-semibold text-amber-800">Customer says paid · {stamp(o.claimedPaidAt)} · verify in ABA before confirming</p>}
            {paid && <p className="text-sm font-semibold text-green-800">Paid{o.paidAt ? ` · ${stamp(o.paidAt)}` : ""}{o.paidManuallyBy ? ` · confirmed by ${o.paidManuallyBy}` : ""}</p>}
          </div>
          {o.method === "QR_IMAGE" && <div className="w-32 md:w-32">{proof ? <button type="button" onClick={() => setZoom(proof)} className="group block w-full text-left" aria-label={`Open payment screenshot for ${o.orderNumber}`}><img loading="lazy" src={proof} alt={`Payment screenshot for ${o.orderNumber}`} className="h-28 w-32 rounded-2xl border-4 border-white object-cover shadow-soft transition group-hover:scale-105" /><span className="mt-1 block text-center text-xs font-bold text-mute">Tap to enlarge</span></button> : <div className="grid h-28 place-items-center rounded-2xl border-2 border-dashed border-sky-border text-center text-xs text-mute md:w-32">No screenshot<br />uploaded</div>}</div>}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5"><MailPill label="Admin mail" s={o.email.status} detail={o.email.detail} /><MailPill label="Customer invoice" s={o.customerEmail?.status ?? (c.email ? "NOT SENT" : "NO EMAIL")} detail={o.customerEmail?.detail} /></div>

        <div className="mt-3 flex flex-wrap gap-2 border-t border-dashed border-sky-border pt-3">
          {o.paymentStatus === "PENDING" && <button disabled={!!busy} onClick={() => markPaid(o)} className={`${act2} bg-sky hover:bg-sky-hover`}>{busy === `paid:${o.orderNumber}` ? "Saving…" : `✓ ${t("Mark as paid (I verified it)")}`}</button>}
          <Link to={`/admin/invoice/${encodeURIComponent(o.orderNumber)}`} className={`${act2} border border-sky-border bg-white hover:bg-sky-pale`} title={invoiceNo(o.orderNumber)}>🧾 Invoice · Print 58/80 mm / A4</Link>
          {c.email && <button disabled={!!busy} onClick={() => void act(`inv:${o.orderNumber}`, `/admin/orders/${encodeURIComponent(o.orderNumber)}/resend-invoice`, `Invoice emailed to ${c.email}.`)} className={`${act2} border border-sky-border bg-white hover:bg-sky-pale`}>{busy === `inv:${o.orderNumber}` ? "Sending…" : "✉️ Send invoice to customer"}</button>}
          {o.email.status !== "SENT" && <button disabled={!!busy} onClick={() => void act(`adm:${o.orderNumber}`, `/admin/orders/${encodeURIComponent(o.orderNumber)}/resend-email`, "Order email sent to the admin inbox.")} className={`${act2} border border-sky-border bg-white hover:bg-sky-pale`}>{busy === `adm:${o.orderNumber}` ? "Sending…" : "↻ Resend admin email"}</button>}
        </div></li>; })}</ul>

    {zoom && <div role="dialog" aria-modal="true" aria-label="Payment screenshot" onClick={() => setZoom("")} onKeyDown={(e) => e.key === "Escape" && setZoom("")} className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="relative max-h-full" onClick={(e) => e.stopPropagation()}><img src={zoom} alt="Payment screenshot" className="max-h-[85vh] max-w-full rounded-2xl border-4 border-white object-contain" />
        <div className="mt-2 flex justify-center gap-2"><a href={zoom} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white px-4 py-2 text-sm font-bold">Open full size</a><button autoFocus onClick={() => setZoom("")} className="rounded-full bg-sky px-4 py-2 text-sm font-bold">Close</button></div></div></div>}
  </div>);
}
