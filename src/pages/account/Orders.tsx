import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import RequireUser from "@/components/RequireUser";
import { useResource } from "@/lib/data";
import { apiJson } from "@/lib/api";
import { useTitle } from "@/lib/title";
import type { StoredOrder } from "@shared/types";
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
const when = (iso: string, locale?: string) => new Date(iso).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
type Filter = "ALL" | "PAID" | "COD";
const FILTERS: { id: Filter; label: string }[] = [{ id: "ALL", label: "All" }, { id: "PAID", label: "Paid" }, { id: "COD", label: "Pay with delivery" }];
function List({ email }: { email: string }) {
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState<Filter>("ALL");
  const { data, loading, error, refresh } = useResource<{ orders: StoredOrder[] }>(`account:orders:${email}`, () => apiJson("/account/orders"));
  if (error && (error as Error & { status?: number }).status === 401 && !data) return <Navigate to="/login?next=%2Faccount%2Forders" replace />; // session expired
  const orders = data?.orders ?? [];
  const shown = orders.filter((o) => filter === "ALL" || (filter === "PAID" ? o.paymentStatus === "PAID" : o.method === "COD" && o.paymentStatus !== "PAID"));
  const spent = orders.filter((o) => o.paymentStatus === "PAID").reduce((s, o) => s + o.totalCents, 0);
  return (<div className="max-w-xl space-y-4"><Link to="/account" className="text-sm font-semibold underline">← {t("My account")}</Link>
    <h1 className="text-2xl font-extrabold sm:text-3xl">{t("Order history")}</h1>
    <p className="text-sm text-mute">{t("Everything you bought while signed in as {email}.", { email })}</p>
    {error && !data ? <div role="alert" className="space-y-2 rounded-xl2 bg-amber-100 p-4 text-sm text-amber-900">{t("We couldn't load your orders.")} <button onClick={refresh} className="font-bold underline">{t("Try again")}</button></div>
      : loading ? <div className="h-24 animate-pulse rounded-xl2 bg-sky-pale" aria-busy="true" />
      : orders.length === 0 ? <p className="rounded-xl2 bg-sky-pale p-6">{t("No orders yet.")} <Link to="/shop" className="underline">{t("Browse toys")}</Link></p>
      : <>
        <p className="rounded-xl2 bg-sky-pale p-4 text-sm"><b>{orders.length}</b> {t(orders.length === 1 ? "order" : "orders")} · <b>{usd(spent)}</b> {t("paid so far")}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("Filter orders")}>{FILTERS.map((f) => <button key={f.id} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id} className={`min-h-11 rounded-full border px-4 text-sm font-bold ${filter === f.id ? "border-ink bg-ink text-white" : "border-sky-border bg-white"}`}>{t(f.label)}</button>)}</div>
        {shown.length === 0 ? <p className="rounded-xl2 bg-sky-pale p-6 text-sm">{t("No orders match this filter.")}</p>
        : <ul className="space-y-3">{shown.map((o) => <li key={o.orderNumber} className="space-y-2 rounded-xl2 border border-sky-border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-extrabold">{o.orderNumber}</p><p className="text-xs text-mute">{when(o.createdAt, locale)}</p></div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${o.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{o.paymentStatus === "PAID" ? t(o.method === "BAKONG" ? "Paid with Bakong" : o.method === "COD" ? "Paid on delivery" : "Paid") : t("Pay with delivery")}</span></div>
          <ul className="text-sm">{o.items.map((i, n) => <li key={`${i.productId}-${n}`} className="flex justify-between gap-2"><span>{i.name} × {i.qty}</span><span>{usd(i.lineCents)}</span></li>)}</ul>
          <div className="space-y-0.5 border-t border-sky-border pt-2 text-sm">
            <p className="flex justify-between text-mute"><span>{t("Subtotal")}</span><span>{usd(o.subtotalCents)}</span></p>
            {o.discountCents > 0 && <p className="flex justify-between text-green-700"><span>{t("Discount")}{o.discountCode ? ` (${o.discountCode})` : ""}</span><span>−{usd(o.discountCents)}</span></p>}
            <p className="flex justify-between text-mute"><span>{t("Delivery")}</span><span>{usd(o.shippingCents)}</span></p>
            <p className="flex justify-between font-extrabold"><span>{t("Total")}</span><span>{usd(o.totalCents)}</span></p></div>
          <Link to={`/payment/${o.orderNumber}`} className="inline-block text-sm font-semibold underline">{t("View order")}</Link></li>)}</ul>}
      </>}</div>);
}
export default function AccountOrders() { useTitle("Order history"); return <RequireUser>{(u) => <List email={u.email ?? u.id} />}</RequireUser>; }
