import { useEffect, useState } from "react";
import { areaLabel } from "@shared/delivery";
import { useParams } from "react-router-dom";
import PayQr from "@/components/PayQr";
import NotFound from "@/components/NotFound";
import { useSettings } from "@/lib/store";
import { useTitle } from "@/lib/title";
import type { StoredOrder } from "@shared/types";
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
export default function Payment() {
  useTitle("Payment", true); const { orderNumber } = useParams(); const { settings: s } = useSettings();
  const [o, setO] = useState<StoredOrder | null | undefined>(undefined);
  useEffect(() => { let live = true; setO(undefined); fetch(`/api/orders/${encodeURIComponent(orderNumber ?? "")}`).then((r) => (r.ok ? r.json() : null)).then((j) => live && setO(j?.order ?? null)).catch(() => live && setO(null)); return () => { live = false; }; }, [orderNumber]);
  if (o === undefined) return <div className="mx-auto max-w-xl animate-pulse space-y-4" aria-busy="true"><div className="h-9 w-64 rounded-full bg-sky-pale" /><div className="h-14 rounded-xl2 bg-sky-pale" /><div className="h-40 rounded-xl2 bg-sky-pale" /></div>;
  if (!o) return <NotFound />;
  return (<div className="mx-auto max-w-xl space-y-4"><h1 className="text-2xl font-extrabold sm:text-3xl">Order {o.orderNumber}</h1>
    <p role="status" className="rounded-xl2 bg-green-100 p-4 font-semibold">Order received. Status: {o.paymentStatus === "PAID" ? "Paid" : o.method === "COD" ? "Pay with delivery" : "Waiting for payment verification"}</p>
    <ul className="rounded-xl2 border border-sky-border bg-white p-5">{o.items.map((i) => <li key={i.productId} className="flex justify-between"><span>{i.name} × {i.qty}</span><span>{usd(i.lineCents)}</span></li>)}
      {o.discountCents > 0 && <><li className="mt-2 flex justify-between border-t border-sky-border pt-2 text-mute"><span>Subtotal</span><span>{usd(o.subtotalCents)}</span></li>
        <li className="flex justify-between font-semibold text-green-700"><span>Discount{o.discountCode ? ` (${o.discountCode})` : ""}</span><span>−{usd(o.discountCents)}</span></li></>}
      <li className={`${o.discountCents > 0 ? "" : "mt-2 border-t border-sky-border pt-2 "}flex justify-between text-mute`}><span>Delivery ({areaLabel(o)})</span><span>{usd(o.shippingCents)}</span></li>
      <li className="flex justify-between text-lg font-extrabold"><span>Total</span><span>{usd(o.totalCents)} {o.currency}</span></li></ul>
    {o.paymentStatus === "PENDING" && o.method === "COD" && <p className="rounded-xl2 bg-sky-pale p-5">Please prepare <b>{usd(o.totalCents)}</b> in cash for the delivery driver.</p>}
    {o.paymentStatus === "PENDING" && o.method === "QR_IMAGE" && <PayQr orderNumber={o.orderNumber} total={usd(o.totalCents)} telegram={s.telegramUrl} facebook={s.facebookUrl} />}
    <p className="text-xs text-mute">Admin email: {o.email.status === "SENT" ? "sent" : o.email.status === "SKIPPED" ? `not sent (${o.email.detail})` : o.email.status === "FAILED" ? `failed (${o.email.detail})` : o.method === "QR_IMAGE" ? "will be sent when you press “I have paid”" : "pending"}</p></div>);
}
