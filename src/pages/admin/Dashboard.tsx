import { Link } from "react-router-dom";
import { stockStatus, type Product } from "@shared/products";
import { summarize, dailyRevenue, topProducts, sortOrders, usd, stamp } from "@shared/stats";
import type { StoredOrder } from "@shared/types";
import ExportButtons from "@/components/admin/ExportButtons";
import Skeleton from "@/components/Skeleton";
import { useTitle } from "@/lib/title";
import { useAdmin } from "./hooks";
const card = "rounded-xl2 border border-sky-border bg-white p-5 shadow-soft";
export default function Dashboard() {
  useTitle("Admin dashboard", true);
  const { data } = useAdmin<{ orders: StoredOrder[]; products: Product[] }>("/admin/dashboard");
  if (!data) return <Skeleton />;
  const { orders, products } = data;
  const s = summarize(orders), days = dailyRevenue(orders), max = Math.max(1, ...days.map((d) => d.cents));
  const lowest = sortOrders(orders, "low").slice(0, 5), highest = sortOrders(orders, "high").slice(0, 5);
  const out = products.filter((p) => stockStatus(p.stock) === "OUT"), low = products.filter((p) => stockStatus(p.stock) === "LOW");
  const top = topProducts(orders), stockValue = products.reduce((t, p) => t + (p.salePrice ?? p.price) * p.stock, 0);
  const Row = ({ o }: { o: StoredOrder }) => <li className="flex justify-between gap-3 border-b border-sky-border py-2 last:border-0"><span>{o.orderNumber}<span className="block text-xs text-mute">{o.customer.name} · {stamp(o.createdAt)} · {o.paymentStatus}</span></span><b>{usd(o.totalCents)}</b></li>;
  return (<div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-extrabold">Dashboard</h1>
      <div className="flex flex-wrap gap-2"><ExportButtons type="orders" /></div></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className={card}><p className="text-sm text-mute">Paid revenue</p><p className="text-2xl font-extrabold">{usd(s.paidCents)}</p><p className="text-xs text-mute">{s.paidCount} paid orders</p></div>
      <div className={card}><p className="text-sm text-mute">Waiting for payment</p><p className="text-2xl font-extrabold">{usd(s.pendingCents)}</p><p className="text-xs text-mute">{s.pendingCount} pending orders</p></div>
      <div className={card}><p className="text-sm text-mute">All orders</p><p className="text-2xl font-extrabold">{s.count}</p><p className="text-xs text-mute">Average {usd(s.avgCents)}</p></div>
      <div className={card}><p className="text-sm text-mute">Stock value</p><p className="text-2xl font-extrabold">${stockValue.toFixed(2)}</p><p className="text-xs text-mute">{products.length} products</p></div></div>
    <section className={card} aria-label="Paid revenue, last 14 days"><h2 className="mb-3 font-extrabold">Paid revenue, last 14 days</h2>
      <div className="flex h-40 items-end gap-1">{days.map((d) => <div key={d.day} className="flex h-full flex-1 flex-col justify-end text-center" title={`${d.day}: ${usd(d.cents)} (${d.orders} orders)`}><div className="rounded-t bg-sky" style={{ height: `${Math.max(d.cents ? 4 : 1, (d.cents / max) * 100)}%` }} /><span className="mt-1 text-[10px] text-mute">{d.day.slice(8)}</span></div>)}</div></section>
    <div className="grid gap-4 md:grid-cols-2">
      <section className={card}><div className="mb-2 flex items-center justify-between"><h2 className="font-extrabold">Highest transactions</h2><Link to="/admin/transactions?sort=high" className="text-sm underline">See all</Link></div>{highest.length ? <ul>{highest.map((o) => <Row key={o.orderNumber} o={o} />)}</ul> : <p className="text-mute">No orders yet.</p>}</section>
      <section className={card}><div className="mb-2 flex items-center justify-between"><h2 className="font-extrabold">Lowest transactions</h2><Link to="/admin/transactions?sort=low" className="text-sm underline">See all</Link></div>{lowest.length ? <ul>{lowest.map((o) => <Row key={o.orderNumber} o={o} />)}</ul> : <p className="text-mute">No orders yet.</p>}</section>
      <section className={card}><div className="mb-2 flex items-center justify-between"><h2 className="font-extrabold">Stock alerts</h2><Link to="/admin/stock" className="text-sm underline">Manage stock</Link></div>
        {out.length + low.length === 0 ? <p className="text-mute">All products have healthy stock.</p> : <ul>{[...out, ...low].map((p) => <li key={p.id} className="flex justify-between border-b border-sky-border py-2 last:border-0"><Link to={`/admin/products/${p.id}`} className="underline">{p.name}</Link><b className={p.stock <= 0 ? "text-red-700" : "text-amber-700"}>{p.stock <= 0 ? "Out of stock" : `${p.stock} left`}</b></li>)}</ul>}</section>
      <section className={card}><h2 className="mb-2 font-extrabold">Best sellers</h2>{top.length ? <ul>{top.map((t) => <li key={t.sku} className="flex justify-between border-b border-sky-border py-2 last:border-0"><span>{t.name}</span><span>{t.qty} sold · {usd(t.cents)}</span></li>)}</ul> : <p className="text-mute">No sales yet.</p>}</section></div>
    <section className={card}><h2 className="mb-3 font-extrabold">Export all data</h2><div className="grid gap-3 sm:grid-cols-2">
      {(["orders", "transactions", "products", "stock"] as const).map((t) => <div key={t} className="flex items-center justify-between gap-2 rounded-xl bg-sky-pale p-3"><span className="font-semibold capitalize">{t}</span><ExportButtons type={t} /></div>)}</div>
      <p className="mt-2 text-xs text-mute">PDF shows Latin letters only (Khmer prints as ?). Use CSV when you need Khmer names.</p></section></div>);
}
