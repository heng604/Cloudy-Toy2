import { Link, useSearchParams } from "react-router-dom";
import { methodLabel } from "@shared/delivery";
import { filterOrders, sortOrders, usd, stamp } from "@shared/stats";
import { PAYMENT_STATUSES } from "@shared/orders";
import type { StoredOrder } from "@shared/types";
import ExportButtons from "@/components/admin/ExportButtons";
import Skeleton from "@/components/Skeleton";
import { getSubmit } from "@/lib/forms";
import { post } from "@/lib/api";
import { useTitle } from "@/lib/title";
import { useAdmin, refreshAdmin } from "./hooks";
export default function AdminOrders() {
  useTitle("Orders", true);
  const [sp, setSp] = useSearchParams(); const { data } = useAdmin<{ orders: StoredOrder[] }>("/admin/orders");
  if (!data) return <Skeleton />;
  const status = sp.get("status") ?? undefined, q = sp.get("q") ?? undefined; const f = { status, q };
  const orders = sortOrders(filterOrders(data.orders, f), "new");
  const cls = "rounded-full border border-sky-border bg-white px-4 py-2";
  const markPaid = async (n: string) => { await post(`/admin/orders/${encodeURIComponent(n)}/mark-paid`); refreshAdmin(); };
  return (<div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-extrabold">Orders</h1><ExportButtons type="orders" params={f} /></div>
    <form key={sp.toString()} onSubmit={getSubmit(setSp)} className="flex flex-wrap gap-2"><input name="q" defaultValue={q} placeholder="Search order, name, phone, email" className={`${cls} min-w-60 flex-1`} aria-label="Search orders" />
      <select name="status" defaultValue={status ?? "ALL"} className={cls} aria-label="Payment status"><option value="ALL">All statuses</option>{PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
      <button className="rounded-full bg-sky px-5 py-2 font-bold hover:bg-sky-hover">Filter</button><Link to="/admin/orders" className={cls}>Reset</Link></form>
    {orders.length === 0 && <p className="rounded-xl2 bg-sky-pale p-6">No orders match.</p>}
    <ul className="space-y-3">{orders.map((o) => <li key={o.orderNumber} className="rounded-xl2 border border-sky-border bg-white p-4"><p className="font-bold">{o.orderNumber} · {usd(o.totalCents)} · {methodLabel(o.method)}</p>
      <p className="text-sm text-mute">{stamp(o.createdAt)} · {o.customer.name} · {o.customer.phone}{o.customer.facebook ? ` · FB: ${o.customer.facebook}` : ""}{o.customer.telegram ? ` · TG: ${o.customer.telegram}` : ""} · {o.area === "PHNOM_PENH" ? "Phnom Penh" : "Province"} · {o.paymentStatus}{o.paidManuallyBy ? ` (confirmed by ${o.paidManuallyBy})` : ""}</p>
      {o.claimedPaidAt && o.paymentStatus === "PENDING" && <p className="mt-1 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Customer says paid · {stamp(o.claimedPaidAt)} · verify in ABA</p>}
      <p className="mt-1 text-sm">{o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}</p><p className="text-sm text-mute">{o.customer.address}</p>
      {o.paymentStatus === "PENDING" && <div className="mt-2"><button onClick={() => markPaid(o.orderNumber)} className="rounded-full bg-sky px-4 py-2 font-bold hover:bg-sky-hover">Mark as paid (I verified it)</button></div>}</li>)}</ul></div>);
}
