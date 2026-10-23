import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
type Qr = { image: string; expiresAt: number; merchant: string };
const POLL_MS = 3000;
/** Bakong KHQR checkout: shows the QR for this order, checks the bank every few seconds, and pops up a green "Payment successful" card when it is paid.
 *  The server confirms the payment with Bakong and emails the admin the PAID invoice; this page only shows the result. */
export default function BakongPay({ orderNumber, total }: { orderNumber: string; total: string }) {
  const navigate = useNavigate(); const dlg = useRef<HTMLDialogElement>(null);
  const [qr, setQr] = useState<Qr | null>(null); const [err, setErr] = useState(""); const [left, setLeft] = useState(0); const [paid, setPaid] = useState(false); const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const r = await fetch("/api/payment/bakong/qr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber }) });
      const j = await r.json().catch(() => ({})) as { paid?: boolean; error?: string } & Partial<Qr>;
      if (!r.ok) { setErr(j.error ?? "Could not create the QR code."); return; }
      if (j.paid) { setPaid(true); return; }
      setQr({ image: j.image!, expiresAt: j.expiresAt!, merchant: j.merchant ?? "Cloudy Toys" });
    } catch { setErr("Could not create the QR code (network error)."); } finally { setLoading(false); }
  }, [orderNumber]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!qr) return; const tick = () => setLeft(Math.max(0, Math.round((qr.expiresAt - Date.now()) / 1000))); tick(); const id = setInterval(tick, 1000); return () => clearInterval(id); }, [qr]);
  const expired = !!qr && left === 0;
  useEffect(() => { // ask the server whether Bakong has the payment yet
    if (!qr || paid) return; let live = true; let busy = false;
    const check = async () => { if (busy) return; busy = true; try { const r = await fetch(`/api/payment/bakong/status/${encodeURIComponent(orderNumber)}`); const j = await r.json().catch(() => ({})) as { paid?: boolean }; if (live && j.paid) setPaid(true); } catch { /* try again on the next tick */ } finally { busy = false; } };
    const id = setInterval(() => { if (!document.hidden) void check(); }, POLL_MS); return () => { live = false; clearInterval(id); };
  }, [qr, paid, orderNumber]);
  useEffect(() => { if (paid && !dlg.current?.open) dlg.current?.showModal(); }, [paid]);
  const mmss = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  return (<div className="space-y-3 text-center">
    <div className="mx-auto w-full max-w-xs overflow-hidden rounded-2xl border border-sky-border bg-white shadow-soft">
      <div className="bg-[#e1232e] py-3 text-lg font-extrabold tracking-widest text-white">KHQR</div>
      <div className="px-5 pt-3 text-left"><p className="text-sm text-mute">{qr?.merchant ?? "Cloudy Toys"}</p><p className="text-3xl font-extrabold">{total}</p><p className="text-xs text-mute">USD · {orderNumber}</p></div>
      <div className="border-t border-dashed border-sky-border p-4">
        {qr ? <div className="relative"><img src={qr.image} alt={`Bakong KHQR for ${total}`} className={`mx-auto w-full ${expired ? "opacity-20 blur-sm" : ""}`} />
          {expired && <div className="absolute inset-0 grid place-items-center"><button type="button" onClick={load} disabled={loading} className="rounded-full bg-sky px-5 py-2 font-bold hover:bg-sky-hover disabled:opacity-60">{loading ? "…" : "Get a new QR"}</button></div>}</div>
          : <div className="grid aspect-square place-items-center text-mute" aria-busy="true">{err ? "" : "Creating your QR…"}</div>}
      </div></div>
    {err && <p role="alert" className="text-sm text-red-700">{err} <button type="button" onClick={load} className="underline">Try again</button></p>}
    {qr && !expired && <p className="text-sm text-mute">Open your banking app (ABA, ACLEDA, Wing…), scan, and pay <b>{total}</b>. QR expires in <b>{mmss}</b>.</p>}
    {qr && !expired && <p role="status" className="flex items-center justify-center gap-2 text-sm font-semibold text-mute"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sky" />Waiting for your payment…</p>}
    <dialog ref={dlg} onCancel={(e) => e.preventDefault()} className="w-[min(92vw,22rem)] rounded-3xl p-8 text-center backdrop:bg-black/40">
      <style>{`@keyframes bk-pop{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}@keyframes bk-draw{to{stroke-dashoffset:0}}`}</style>
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-green-500 shadow-lg" style={{ animation: "bk-pop .5s ease-out both" }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" style={{ strokeDasharray: 24, strokeDashoffset: 24, animation: "bk-draw .45s .35s ease-out forwards" }} /></svg></div>
      <h2 className="mt-5 text-2xl font-extrabold text-green-700">Payment successful</h2>
      <p className="mt-2 text-sm">We received <b>{total}</b> for order <b>{orderNumber}</b>. Thank you! Your order has been sent to our team and we will start packing it.</p>
      <button type="button" autoFocus onClick={() => { dlg.current?.close(); navigate("/account/orders"); }} className="mt-5 min-h-11 w-full rounded-full bg-green-600 px-6 font-bold text-white hover:bg-green-700">Done</button>
      <button type="button" onClick={() => { dlg.current?.close(); navigate("/"); }} className="mt-2 text-sm underline">Back to shop</button>
    </dialog>
  </div>);
}
