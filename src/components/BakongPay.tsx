import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
type Qr = { image: string; expiresAt: number; merchant: string };
const POLL_MS = 3000;
/** Bakong KHQR checkout: shows the KHQR ticket for this order, checks the bank every few seconds, and pops up a green "Payment successful" card the moment it is paid.
 *  The server confirms the payment with Bakong and emails the admin the PAID invoice; this page only shows the result. */
export default function BakongPay({ orderNumber, total, onPaid }: { orderNumber: string; total: string; onPaid?: () => void }) {
  const navigate = useNavigate(); const doneBtn = useRef<HTMLButtonElement>(null);
  const [qr, setQr] = useState<Qr | null>(null); const [err, setErr] = useState(""); const [left, setLeft] = useState(0); const [paid, setPaid] = useState(false); const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false);
  const amount = total.replace(/^\$/, "");
  const markPaid = useCallback(() => { setPaid(true); setOpen(true); onPaid?.(); }, [onPaid]);
  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const r = await fetch("/api/payment/bakong/qr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber }) });
      const j = await r.json().catch(() => ({})) as { paid?: boolean; error?: string } & Partial<Qr>;
      if (!r.ok) { setErr(j.error ?? "Could not create the QR code."); return; }
      if (j.paid) { markPaid(); return; }
      setQr({ image: j.image!, expiresAt: j.expiresAt!, merchant: j.merchant ?? "Cloudy Toys" });
    } catch { setErr("Could not create the QR code (network error)."); } finally { setLoading(false); }
  }, [orderNumber, markPaid]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!qr) return; const tick = () => setLeft(Math.max(0, Math.round((qr.expiresAt - Date.now()) / 1000))); tick(); const id = setInterval(tick, 1000); return () => clearInterval(id); }, [qr]);
  const expired = !!qr && left === 0;
  useEffect(() => { // ask the server whether Bakong has the payment yet
    if (!qr || paid) return; let live = true; let busy = false;
    const check = async () => { if (busy) return; busy = true; try { const r = await fetch(`/api/payment/bakong/status/${encodeURIComponent(orderNumber)}`, { cache: "no-store" }); const j = await r.json().catch(() => ({})) as { paid?: boolean }; if (live && j.paid) markPaid(); } catch { /* try again on the next tick */ } finally { busy = false; } };
    const id = setInterval(() => { if (!document.hidden) void check(); }, POLL_MS);
    const back = () => { if (!document.hidden) void check(); }; // customer comes back from the banking app: check right away
    document.addEventListener("visibilitychange", back); window.addEventListener("focus", back); window.addEventListener("pageshow", back);
    return () => { live = false; clearInterval(id); document.removeEventListener("visibilitychange", back); window.removeEventListener("focus", back); window.removeEventListener("pageshow", back); };
  }, [qr, paid, orderNumber, markPaid]);
  useEffect(() => { if (open) doneBtn.current?.focus(); }, [open]);
  const mmss = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  const close = (to: string) => { setOpen(false); navigate(to); };
  return (<div className="space-y-3 text-center">
    <style>{`@keyframes bk-pop{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}@keyframes bk-draw{to{stroke-dashoffset:0}}@keyframes bk-fade{from{opacity:0}to{opacity:1}}@keyframes bk-rise{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}@keyframes bk-ring{0%{transform:scale(.8);opacity:.5}100%{transform:scale(1.7);opacity:0}}`}</style>
    {/* KHQR ticket */}
    <div className="relative mx-auto w-full max-w-[19rem] drop-shadow-[0_14px_30px_rgba(225,35,46,.22)]">
      <div className="overflow-hidden rounded-[1.75rem] bg-white" style={{ WebkitMask: "radial-gradient(circle 12px at 0 var(--cut),transparent 98%,#000) left/51% 100% no-repeat,radial-gradient(circle 12px at 100% var(--cut),transparent 98%,#000) right/51% 100% no-repeat", mask: "radial-gradient(circle 12px at 0 var(--cut),transparent 98%,#000) left/51% 100% no-repeat,radial-gradient(circle 12px at 100% var(--cut),transparent 98%,#000) right/51% 100% no-repeat", ["--cut" as string]: "5.6rem" }}>
        <div className="relative bg-gradient-to-br from-[#e1232e] to-[#c4121d] px-5 pb-5 pt-4" style={{ clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)" }}>
          <img src="/img/khqr-logo.png" alt="KHQR" className="mx-auto h-8 w-auto" />
          <span aria-hidden="true" className="absolute right-0 top-0 h-7 w-7 bg-white/25" style={{ clipPath: "polygon(0 0,100% 100%,0 100%)" }} />
        </div>
        <div className="px-6 pb-3 pt-3 text-left">
          <p className="truncate text-sm font-semibold text-mute">{qr?.merchant ?? "Cloudy Toys"}</p>
          <p className="mt-0.5 flex items-baseline gap-1.5 text-ink"><span className="text-3xl font-extrabold tabular-nums">{amount}</span><span className="text-xs font-bold text-mute">USD</span></p>
          <p className="text-xs text-mute">Order {orderNumber}</p>
        </div>
        <div className="mx-5 border-t-2 border-dashed border-[#f1c7ca]" />
        <div className="p-5 pt-4">
          {qr ? <div className="relative mx-auto aspect-square w-full">
            <img src={qr.image} alt={`Bakong KHQR for ${total}`} className={`h-full w-full rounded-xl ${expired ? "opacity-20 blur-sm" : ""}`} />
            {!expired && <span className="absolute left-1/2 top-1/2 grid h-[19%] w-[19%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white p-[3%]"><img src="/img/khqr-center.png" alt="" className="h-full w-full rounded-full" /></span>}
            {expired && <div className="absolute inset-0 grid place-items-center"><button type="button" onClick={load} disabled={loading} className="rounded-full bg-[#e1232e] px-5 py-2 font-bold text-white hover:bg-[#c4121d] disabled:opacity-60">{loading ? "…" : "Get a new QR"}</button></div>}
          </div> : <div className="grid aspect-square place-items-center text-mute" aria-busy="true">{err ? "" : "Creating your QR…"}</div>}
        </div>
      </div>
    </div>
    {err && <p role="alert" className="text-sm text-red-700">{err} <button type="button" onClick={load} className="underline">Try again</button></p>}
    {qr && !expired && !paid && <p className="text-sm text-mute">Open your banking app (ABA, ACLEDA, Wing…), scan, and pay <b>{total}</b>. QR expires in <b>{mmss}</b>.</p>}
    {qr && !expired && !paid && <p role="status" className="flex items-center justify-center gap-2 text-sm font-semibold text-mute"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#e1232e]" />Waiting for your payment…</p>}
    {paid && !open && <p role="status" className="text-sm font-bold text-green-700">✓ Payment received. <button type="button" onClick={() => setOpen(true)} className="underline">Show receipt</button></p>}
    {/* Payment successful popup */}
    {open && <div className="fixed inset-0 z-[100] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="bk-title" onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" style={{ animation: "bk-fade .25s ease-out both" }} />
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white text-center shadow-2xl" style={{ animation: "bk-rise .35s ease-out both" }}>
        <div className="bg-gradient-to-b from-green-50 to-white px-6 pb-2 pt-8">
          <div className="relative mx-auto h-24 w-24">
            <span aria-hidden="true" className="absolute inset-0 rounded-full bg-green-400" style={{ animation: "bk-ring 1.4s .3s ease-out 2 both" }} />
            <div className="relative grid h-24 w-24 place-items-center rounded-full bg-green-500 shadow-lg" style={{ animation: "bk-pop .5s ease-out both" }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" style={{ strokeDasharray: 24, strokeDashoffset: 24, animation: "bk-draw .45s .35s ease-out forwards" }} /></svg>
            </div>
          </div>
          <h2 id="bk-title" className="mt-5 text-2xl font-extrabold text-green-700">Payment successful</h2>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-ink">{total}</p>
        </div>
        <dl className="mx-6 mt-3 space-y-1.5 border-y border-dashed border-green-200 py-3 text-left text-sm">
          <div className="flex justify-between gap-3"><dt className="text-mute">Order</dt><dd className="font-bold">{orderNumber}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-mute">Paid to</dt><dd className="truncate font-bold">{qr?.merchant ?? "Cloudy Toys"}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-mute">Method</dt><dd className="font-bold">Bakong KHQR</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-mute">Status</dt><dd className="font-bold text-green-700">Paid ✓</dd></div>
        </dl>
        <p className="px-6 pt-3 text-sm text-mute">Thank you! Your order has been sent to our team and we will start packing it.</p>
        <div className="p-6 pt-4">
          <button ref={doneBtn} type="button" onClick={() => close("/account/orders")} className="min-h-11 w-full rounded-full bg-green-600 px-6 font-bold text-white hover:bg-green-700">Done</button>
          <button type="button" onClick={() => close("/")} className="mt-2 text-sm underline">Back to shop</button>
        </div>
      </div>
    </div>}
  </div>);
}
