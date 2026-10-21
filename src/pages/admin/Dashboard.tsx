import { Link } from "react-router-dom";
import { stockStatus, LOW_STOCK, type Product } from "@shared/products";
import { summarize, dailyRevenue, topProducts, sortOrders, dayKey, usd, stamp } from "@shared/stats";
import type { StoredOrder } from "@shared/types";
import ExportButtons from "@/components/admin/ExportButtons";
import { SmoothLine, Donut, Bars, Calendar, C } from "@/components/admin/charts";
import Skeleton from "@/components/Skeleton";
import { useTitle } from "@/lib/title";
import { useI18n } from "@/lib/i18n";
import { useAdmin } from "./hooks";
const card = "rounded-3xl bg-white p-4 shadow-soft sm:p-5";
const Title = ({ children, to, more }: { children: React.ReactNode; to?: string; more?: string }) => <div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-extrabold">{children}</h2>{to && <Link to={to} className="text-sm font-semibold text-teal-600 hover:underline">{more}</Link>}</div>;
export default function Dashboard() {
  const { t, locale } = useI18n(); useTitle(t("Dashboard"), true);
  const { data } = useAdmin<{ orders: StoredOrder[]; products: Product[] }>("/admin/dashboard");
  if (!data) return <Skeleton />;
  const { orders, products } = data;
  const s = summarize(orders), days = dailyRevenue(orders), lowest = sortOrders(orders, "low").slice(0, 5), highest = sortOrders(orders, "high").slice(0, 5);
  const out = products.filter((p) => stockStatus(p.stock) === "OUT"), low = products.filter((p) => stockStatus(p.stock) === "LOW");
  const top = topProducts(orders), stockValue = products.reduce((a, p) => a + (p.salePrice ?? p.price) * p.stock, 0);
  const today = days[days.length - 1].day, marks: Record<string, number> = {}; for (const o of orders) { const k = dayKey(o.createdAt); marks[k] = (marks[k] ?? 0) + 1; }
  const last7 = days.slice(-7), dlabel = (d: string) => d.slice(8);
  const paidBy = (d: string, st: string) => orders.filter((o) => dayKey(o.createdAt) === d && o.paymentStatus === st).length;
  const paidShare = s.count ? (s.paidCount / s.count) * 100 : 0, healthy = products.length - out.length - low.length, healthyShare = products.length ? (healthy / products.length) * 100 : 0;
  const seg = (n: number) => (products.length ? (n / products.length) * 100 : 0);
  const big = "text-2xl font-extrabold leading-tight sm:text-3xl";
  const Row = ({ o }: { o: StoredOrder }) => <li className="flex justify-between gap-3 border-b border-sky-border py-2 text-sm last:border-0"><span className="min-w-0"><span className="block truncate font-semibold">{o.orderNumber}</span><span className="block truncate text-xs text-mute">{o.customer.name} · {stamp(o.createdAt)} · {t(o.paymentStatus)}</span></span><b className="shrink-0">{usd(o.totalCents)}</b></li>;
  return (<div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-extrabold sm:text-3xl">{t("Dashboard")}</h1><ExportButtons type="orders" /></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
      <section className={`${card} xl:col-span-4`} aria-label={t("Paid revenue")}><p className="text-sm font-semibold text-mute">{t("Paid revenue")}</p><p className={big}>{usd(s.paidCents)}</p><p className="mb-2 text-xs text-mute">{t("{n} paid orders", { n: s.paidCount })}</p>
        <SmoothLine ariaLabel={t("Paid revenue, last 14 days")} series={[{ values: days.map((d) => d.cents), color: C.indigo }]} labels={days.map((d) => dlabel(d.day))} height={110} /></section>
      <section className={`${card} grid grid-cols-2 content-start gap-4 xl:col-span-4`}>
        <div><p className="text-sm font-semibold text-mute">{t("All orders")}</p><p className={big}>{s.count}</p><p className="text-xs text-mute">{t("Average {v}", { v: usd(s.avgCents) })}</p></div>
        <div className="border-l border-sky-border pl-4"><p className="text-sm font-semibold text-mute">{t("Waiting for payment")}</p><p className={big}>{usd(s.pendingCents)}</p><p className="text-xs text-mute">{t("{n} pending orders", { n: s.pendingCount })}</p></div>
        <div className="col-span-2 border-t border-sky-border pt-3"><p className="text-sm font-semibold text-mute">{t("Stock value")}</p><p className={big}>${stockValue.toFixed(2)}</p><p className="text-xs text-mute">{t("{n} products", { n: products.length })}</p></div>
        <div className="col-span-2"><SmoothLine ariaLabel={t("Orders per day")} series={[{ values: days.map((d) => d.orders), color: C.teal }]} height={60} dots="none" fill /></div></section>
      <section className={`${card} md:col-span-2 xl:col-span-4`} aria-label={t("Calendar")}><Title>{t("Calendar")}</Title><Calendar marks={marks} locale={locale} today={today} daysLabel={(n) => `${n} ${t("orders")}`} /><p className="mt-2 text-xs text-mute">{t("Days with orders are marked.")}</p></section>
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
      <section className={`${card} flex flex-col items-center gap-3 text-center xl:col-span-4`}><Title>{t("Paid share")}</Title>
        <Donut percent={paidShare} color={C.teal} size={150} label={`${s.paidCount}/${s.count} ${t("orders")}`} ariaLabel={t("Paid share")} />
        <Link to="/admin/orders" className="w-full rounded-full bg-sky px-6 py-2.5 text-center font-extrabold hover:bg-sky-hover">{t("Orders")}</Link></section>
      <section className={`${card} xl:col-span-8`}><Title>{t("Revenue")} · {t("Orders per day")}</Title>
        <div className="mb-2 flex gap-4 text-xs"><span className="flex items-center gap-1.5"><i className="h-2.5 w-5 rounded-full" style={{ background: C.indigo }} />{t("Revenue")}</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-5 rounded-full" style={{ background: C.yellow }} />{t("orders")}</span></div>
        <SmoothLine ariaLabel={t("Revenue")} series={[{ values: days.map((d) => d.cents), color: C.indigo }, { values: days.map((d) => d.orders), color: C.yellow }]} labels={days.map((d) => dlabel(d.day))} width={700} height={190} dots="all" fill /></section>
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <section className={card}><Title to="/admin/stock" more={t("Manage stock")}>{t("Stock alerts")}</Title>
        {out.length + low.length === 0 ? <p className="text-mute">{t("All products have healthy stock.")}</p> : <ul className="space-y-3">{[...out, ...low].slice(0, 6).map((p) => <li key={p.id} className="text-sm"><div className="flex justify-between gap-2"><Link to={`/admin/products/${p.id}`} className="min-w-0 truncate font-semibold hover:underline">{p.name}</Link><b className={p.stock <= 0 ? "text-red-600" : "text-amber-600"}>{p.stock <= 0 ? t("Out of stock") : t("{n} left", { n: p.stock })}</b></div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#E6F4F6]"><div className="h-full rounded-full" style={{ width: `${Math.min(100, (p.stock / (LOW_STOCK + 1)) * 100)}%`, background: p.stock <= 0 ? "#EF4444" : C.yellow }} /></div></li>)}</ul>}
        <div className="mt-4"><p className="mb-1 text-xs font-semibold text-mute">{t("Healthy stock")} · {t("{a} of {b} products", { a: healthy, b: products.length })}</p>
          <div className="flex h-3 overflow-hidden rounded-full bg-[#E6F4F6]" role="img" aria-label={t("In stock")}><i style={{ width: `${seg(healthy)}%`, background: C.indigo }} /><i style={{ width: `${seg(low.length)}%`, background: C.teal }} /><i style={{ width: `${seg(out.length)}%`, background: C.yellow }} /></div></div></section>
      <section className={card}><Title>{t("Orders per day")}</Title><div className="mb-2 flex gap-4 text-xs"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: C.indigo }} />{t("paid")}</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: C.yellow }} />{t("pending")}</span></div>
        <Bars ariaLabel={t("Orders per day")} groups={last7.map((d) => [paidBy(d.day, "PAID"), paidBy(d.day, "PENDING")])} labels={last7.map((d) => dlabel(d.day))} colors={[C.indigo, C.yellow]} /></section>
      <section className={`${card} md:col-span-2 xl:col-span-1`}><Title>{t("Best sellers")}</Title>{top.length ? <ul>{top.map((x) => <li key={x.sku} className="flex justify-between gap-3 border-b border-sky-border py-2 text-sm last:border-0"><span className="min-w-0 truncate">{x.name}</span><span className="shrink-0 text-mute">{t("{n} sold", { n: x.qty })} · {usd(x.cents)}</span></li>)}</ul> : <p className="text-mute">{t("No sales yet.")}</p>}</section>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <section className={card}><Title to="/admin/transactions?sort=high" more={t("See all")}>{t("Highest transactions")}</Title>{highest.length ? <ul>{highest.map((o) => <Row key={o.orderNumber} o={o} />)}</ul> : <p className="text-mute">{t("No orders yet.")}</p>}</section>
      <section className={card}><Title to="/admin/transactions?sort=low" more={t("See all")}>{t("Lowest transactions")}</Title>{lowest.length ? <ul>{lowest.map((o) => <Row key={o.orderNumber} o={o} />)}</ul> : <p className="text-mute">{t("No orders yet.")}</p>}</section></div>
    <section className={card}><Title>{t("Export all data")}</Title><div className="grid gap-3 sm:grid-cols-2">
      {(["orders", "transactions", "products", "stock"] as const).map((k) => <div key={k} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-sky-pale p-3"><span className="font-semibold capitalize">{t(k === "orders" ? "Orders" : k === "transactions" ? "Transactions" : k === "products" ? "Products" : "Stock")}</span><ExportButtons type={k} /></div>)}</div>
      <p className="mt-2 text-xs text-mute">PDF shows Latin letters only (Khmer prints as ?). Use CSV when you need Khmer names.</p></section></div>);
}
