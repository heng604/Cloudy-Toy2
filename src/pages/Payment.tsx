import { useEffect, useState } from "react";
import { areaLabel } from "@shared/delivery";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import PayQr from "@/components/PayQr";
import BakongPay from "@/components/BakongPay";
import NotFound from "@/components/NotFound";
import { useSettings } from "@/lib/store";
import { useTitle } from "@/lib/title";
import type { StoredOrder } from "@shared/types";
import { payNowCents } from "@shared/orders";
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
export default function Payment() {
  useTitle("Payment", true); const { orderNumber } = useParams(); const { settings: s } = useSettings();
  const [o, setO] = useState<StoredOrder | null | undefined>(undefined); const [justPaid, setJustPaid] = useState(false);
  useEffect(() => { let live = true; setO(undefined); fetch(`/api/orders/${encodeURIComponent(orderNumber ?? "")}`).then((r) => (r.ok ? r.json() : null)).then((j) => live && setO(j?.order ?? null)).catch(() => live && setO(null)); return () => { live = false; }; }, [orderNumber]);
  const navigate = useNavigate(); const placed = !!(useLocation().state as { placed?: boolean } | null)?.placed; const [thanks, setThanks] = useState(true); const [secs, setSecs] = useState(8);
  const showThanks = placed && thanks && !!o && o.method === "COD" && o.paymentStatus === "PENDING";
  useEffect(() => { if (!showThanks) return; const id = setInterval(() => setSecs((n) => n - 1), 1000); return () => clearInterval(id); }, [showThanks]);
  useEffect(() => { if (showThanks && secs <= 0) navigate("/", { replace: true }); }, [showThanks, secs, navigate]);
  useEffect(() => { if (o && o.method === "BAKONG" && (o.paymentStatus === "FAILED" || o.paymentStatus === "EXPIRED")) { const id = setTimeout(() => navigate("/"), 3500); return () => clearTimeout(id); } }, [o, navigate]); // a cancelled or expired Bakong order goes back to the home page
  if (o === undefined) return <div className="mx-auto max-w-xl animate-pulse space-y-4" aria-busy="true"><div className="h-9 w-64 rounded-full bg-sky-pale" /><div className="h-14 rounded-xl2 bg-sky-pale" /><div className="h-40 rounded-xl2 bg-sky-pale" /></div>;
  if (!o) return <NotFound />;
  const paid = o.paymentStatus === "PAID" || justPaid, dead = o.paymentStatus === "FAILED" || o.paymentStatus === "EXPIRED"; const autoSum = (o.autoDiscounts ?? []).reduce((x, a) => x + a.cents, 0), codeOff = o.discountCents - autoSum;
  const status = paid ? "Paid" : o.paymentStatus === "FAILED" ? "Cancelled" : o.paymentStatus === "EXPIRED" ? "Expired (no payment received)" : o.method === "COD" ? "Pay with delivery" : o.method === "BAKONG" ? "Waiting for your Bakong payment" : "Waiting for payment verification";
  const how = o.method === "BAKONG" ? "Bakong KHQR" : o.method === "COD" ? `Pay with Delivery (${areaLabel(o)})` : "QR image payment";
  const row = "flex justify-between gap-3 text-sm"; const sec = "mt-3 text-[11px] font-extrabold uppercase tracking-wide text-mute";
  return (<div className="mx-auto max-w-3xl space-y-4">
    {showThanks && o && <div className="fixed inset-0 z-[100] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="cod-title"><div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-500 text-4xl text-white shadow-lg" aria-hidden="true">✓</div>
        <h2 id="cod-title" className="mt-4 font-display text-2xl font-extrabold text-green-700">Yay, your order is placed!</h2>
        <p className="mt-1 text-sm text-mute">Thank you, {o.customer.name.split(" ")[0]}! We have sent your order to our team and a copy to your email. Please have <b>{usd(o.totalCents)}</b> ready when we deliver.</p>
        <p className="mt-2 rounded-xl bg-sky-pale px-3 py-2 text-sm">Order number <b>{o.orderNumber}</b></p>
        <button type="button" onClick={() => navigate("/", { replace: true })} className="btn-blue mt-4 min-h-11 w-full rounded-full px-6 font-extrabold">Back to home</button>
        <button type="button" onClick={() => setThanks(false)} className="mt-2 text-sm underline">See my order</button>
        <p className="mt-2 text-xs text-mute">Taking you home in {Math.max(0, secs)}s</p></div></div>}
<div><h1 className="font-display text-3xl font-extrabold text-[#2B1A8F] sm:text-4xl">Your order</h1><p className="text-mute">Thank you for shopping with Cloudy Toys ♡</p></div>
    <section className={`rounded-3xl border bg-white/90 p-4 shadow-soft sm:p-6 ${dead ? "border-slate-200" : "border-[#BFEBD8]"}`}>
      <div className="flex items-center gap-3"><span aria-hidden="true" className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl ${dead ? "bg-slate-100" : paid ? "bg-[#DDF6EA] text-green-700" : "bg-[#EEF4FF] text-[#5B3FC8]"}`}>{dead ? "✕" : paid ? "✓" : "⏳"}</span>
        <div className="min-w-0"><h2 role="status" className="font-display text-xl font-extrabold text-[#2B1A8F] sm:text-2xl">{paid ? "Payment received. Thank you!" : dead ? "Order closed" : "We got your order!"} — Order {o.orderNumber}</h2><p className="text-sm text-mute">Status: {status}{paid && o.memberTier ? " · Your Cloudy Toys loyalty points and membership have been updated automatically." : ""}</p></div></div>
      <div className="mt-4 rounded-2xl border border-[#D6E6FB] bg-[#F3F8FF] p-4"><div className="flex items-center justify-between"><p className="font-display text-lg font-extrabold text-[#2B1A8F]">Order Breakdown</p><span className="font-mono text-xs text-mute">{o.orderNumber}</span></div>
        <p className={sec}>1. Subtotal &amp; delivery</p>
        {o.items.map((i) => <p key={`${i.productId}-${i.option ?? ""}`} className={row}><span>{i.name}{i.option ? ` (${i.option})` : ""} × {i.qty}</span><span className="font-semibold">{usd(i.lineCents)}</span></p>)}
        <p className={`${row} font-bold`}><span>Product Subtotal</span><span>{usd(o.subtotalCents)}</span></p>
        <p className={`${row} text-mute`}><span>Delivery Fee ({areaLabel(o)})</span><span>{usd(o.shippingCents)}</span></p>
        <p className={sec}>2. Applied loyalty discounts</p>
        {o.discountCents <= 0 ? <p className={`${row} text-mute`}><span>No loyalty discounts applied</span><span>$0.00</span></p> : <>{(o.autoDiscounts ?? []).map((a) => <p key={a.id} className={`${row} font-semibold text-green-700`}><span>{a.name}</span><span>−{usd(a.cents)}</span></p>)}{codeOff > 0 && <p className={`${row} font-semibold text-green-700`}><span>Discount{o.discountCode ? ` (${o.discountCode})` : ""}</span><span>−{usd(codeOff)}</span></p>}</>}
        <p className="mt-3 flex items-baseline justify-between border-t border-[#D6E6FB] pt-3"><span className="font-extrabold text-[#2B1A8F]">{paid ? "Total Paid" : "Total Due"}</span><span className="text-2xl font-extrabold text-[#2B1A8F]">{usd(o.totalCents)} <span className="text-xs font-semibold text-mute">{o.currency}</span></span></p>
        <p className={sec}>Contact, delivery &amp; payment</p>
        <div className="grid gap-x-6 gap-y-0.5 text-sm sm:grid-cols-2"><p>Name: <b>{o.customer.name}</b></p><p className="break-all">Email: <b>{o.customer.email}</b></p><p>Phone: <b>{o.customer.phone}</b></p><p>Payment: <b className="text-[#5B3FC8]">{how}</b></p><p>Delivery area: <b>{areaLabel(o)}</b></p><p>Address: <b>{o.customer.address}</b></p></div></div>
      {o.memberTier && <p className="mt-3 rounded-2xl border border-[#D6E6FB] bg-[#EEF4FF] p-3 text-sm font-bold text-[#2B1A8F]">✦ {o.memberTier} member{(o.memberPerks ?? []).length > 0 ? ` · ${(o.memberPerks ?? []).join(", ")}` : ""}</p>}
      <div className="mt-4 flex flex-wrap gap-3"><Link to="/shop" className="btn-blue inline-flex min-h-11 items-center rounded-full px-6 font-extrabold">Continue Shopping</Link><Link to="/account" className="inline-flex min-h-11 items-center rounded-full border border-sky-border bg-white px-6 font-extrabold text-[#2B1A8F] hover:bg-sky-pale">View My Membership</Link></div></section>
    {o.preorder && <p className="rounded-3xl bg-[#FFF6D8] p-4 text-sm"><b>Pre-order.</b> {o.preorder.balanceCents > 0 ? <>Pay the {o.preorder.percent}% deposit of <b>{usd(o.preorder.depositCents)}</b> now. The balance of <b>{usd(o.preorder.balanceCents)}</b> is paid when your order is dispatched (about {o.preorder.dispatch}).</> : <>Pay the full price of <b>{usd(o.preorder.depositCents)}</b> now. Nothing more to pay later. We dispatch in about {o.preorder.dispatch}.</>}</p>}
    {o.paymentStatus === "PENDING" && o.method === "COD" && <p className="rounded-3xl bg-white/90 p-5 shadow-soft">Please prepare <b>{usd(o.totalCents)}</b> in cash for the delivery driver.</p>}
    {(o.paymentStatus === "PENDING" || justPaid) && o.method === "BAKONG" && <BakongPay orderNumber={o.orderNumber} total={usd(payNowCents(o))} onPaid={() => setJustPaid(true)} />}
    {o.paymentStatus === "PENDING" && o.method === "QR_IMAGE" && <PayQr orderNumber={o.orderNumber} total={usd(payNowCents(o))} telegram={s.telegramUrl} facebook={s.facebookUrl} />}
    <p className="text-xs text-mute">Admin email: {o.email.status === "SENT" ? "sent" : o.email.status === "SKIPPED" ? `not sent` : o.email.status === "FAILED" ? `failed` : o.method === "BAKONG" ? "will be sent as soon as your payment is confirmed" : o.method === "QR_IMAGE" ? "will be sent when you press “I have paid”" : "pending"}</p></div>);
}
