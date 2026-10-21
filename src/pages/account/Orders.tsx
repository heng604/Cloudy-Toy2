import { Link } from "react-router-dom";
import RequireUser from "@/components/RequireUser";
import { useResource } from "@/lib/data";
import { apiJson } from "@/lib/api";
import { useTitle } from "@/lib/title";
import type { StoredOrder } from "@shared/types";
function List({ email }: { email: string }) {
  const { data, loading } = useResource<{ orders: StoredOrder[] }>(`account:orders:${email}`, () => apiJson("/account/orders"));
  const orders = data?.orders ?? [];
  return (<div className="max-w-xl space-y-4"><h1 className="text-3xl font-extrabold">Order history</h1>
    <p className="text-xs text-mute">Test mode: orders are matched by your account email from the local test store. Production will read from the database under row-level security.</p>
    {loading ? <div className="h-24 animate-pulse rounded-xl2 bg-sky-pale" aria-busy="true" /> : orders.length === 0 ? <p className="rounded-xl2 bg-sky-pale p-6">No orders yet. <Link to="/shop" className="underline">Browse toys</Link></p>
      : <ul className="space-y-3">{orders.map((o) => <li key={o.orderNumber}><Link to={`/payment/${o.orderNumber}`} className="flex justify-between rounded-xl2 border border-sky-border bg-white p-4"><span>{o.orderNumber}</span><span>${(o.totalCents / 100).toFixed(2)} · {o.paymentStatus}</span></Link></li>)}</ul>}</div>);
}
export default function AccountOrders() { useTitle("Order history"); return <RequireUser>{(u) => <List email={u.email ?? u.id} />}</RequireUser>; }
