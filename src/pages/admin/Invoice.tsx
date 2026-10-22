import { useLayoutEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAdmin } from "./hooks";
import Skeleton from "@/components/Skeleton";
import { toPng } from "html-to-image";
import Invoice, { INVOICE_WIDTH } from "@/components/Invoice";
import NotFound from "@/components/NotFound";
import { useSettings } from "@/lib/store";
import { useTitle } from "@/lib/title";
import { invoiceNo } from "@shared/invoice";
import type { StoredOrder } from "@shared/types";
/** Admin only (lives under /admin, which shows the 404 page to everyone else). The only place an invoice can be viewed, printed or downloaded. */
export default function AdminInvoice() {
  useTitle("Invoice", true); const { orderNumber } = useParams(); const { settings } = useSettings();
  const { data } = useAdmin<{ orders: StoredOrder[] }>("/admin/orders");
  const o = data ? data.orders.find((x) => x.orderNumber === orderNumber) ?? null : undefined;
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const inv = useRef<HTMLDivElement>(null); const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1); const [h, setH] = useState(0);
  // phones: shrink the 760px invoice to fit the screen (the exported image is always full size)
  useLayoutEffect(() => {
    const fit = () => { const w = box.current?.clientWidth ?? INVOICE_WIDTH; const s = Math.min(1, w / INVOICE_WIDTH); setScale(s); setH((inv.current?.offsetHeight ?? 0) * s); };
    fit(); const ro = new ResizeObserver(fit); if (box.current) ro.observe(box.current); if (inv.current) ro.observe(inv.current); return () => ro.disconnect();
  }, [o]);
  if (o === undefined) return <Skeleton />;
  if (!o) return <NotFound />;
  const save = async () => {
    if (!inv.current) return; setBusy(true); setErr("");
    try {
      try { await document.fonts?.ready; } catch { /* fonts are optional */ }
      // 3x = sharp on paper (about 2280px wide, good for A4 at 300 dpi). Two tries: the first one warms up font/image loading in some browsers.
      const opts = { pixelRatio: 3, backgroundColor: "#ffffff", cacheBust: true };
      await toPng(inv.current, opts).catch(() => undefined);
      const url = await toPng(inv.current, opts);
      const a = document.createElement("a"); a.href = url; a.download = `${invoiceNo(o.orderNumber)}.png`; a.click();
    } catch { setErr("Could not make the image. Please use Print, then choose “Save as PDF”."); }
    setBusy(false);
  };
  const btn = "min-h-11 rounded-full px-5 font-bold";
  return (<div className="mx-auto max-w-3xl space-y-4">
    <div className="no-print flex flex-wrap items-center justify-between gap-3">
      <Link to="/admin/orders" className="text-sm font-semibold underline">← Back to orders</Link>
      <div className="flex flex-wrap gap-2">
        <button onClick={save} disabled={busy} className={`${btn} bg-sky hover:bg-sky-hover disabled:opacity-60`}>{busy ? "Making image…" : "Download image (PNG)"}</button>
        <button onClick={() => window.print()} className={`${btn} border border-sky-border bg-white`}>Print</button>
      </div>
    </div>
    {err && <p role="alert" className="no-print rounded-xl2 bg-amber-100 p-3 text-sm text-amber-900">{err}</p>}
    <div ref={box} className="invoice-print-box w-full" style={{ height: h || undefined }}>
      <div style={{ width: INVOICE_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }} className="invoice-print-inner"><Invoice ref={inv} order={o} settings={settings} /></div>
    </div>
  </div>);
}
