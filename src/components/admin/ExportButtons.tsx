import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { api, download } from "@/lib/api";
/** Buttons that download from the admin-only export route. `params` carries the current filters.
 *  "Export Google Sheet" copies the report (same template as the PDF, with colours and real numbers) and opens a new Google Sheet: click cell A1 and paste. */
export default function ExportButtons({ type, params = {} }: { type: "orders" | "transactions" | "delivery" | "products" | "stock"; params?: Record<string, string | undefined> }) {
  const [busy, setBusy] = useState(false); const [hint, setHint] = useState<"" | "copied" | "file">(""); const { t } = useI18n();
  const qs = (format: string) => new URLSearchParams(Object.entries({ type, format, ...params }).filter(([, v]) => v) as [string, string][]).toString();
  const go = async (f: string) => { setBusy(true); try { await download(`/admin/export?${qs(f)}`); if (f === "xlsx") setHint("file"); } catch { alert("Could not export. Please try again."); } finally { setBusy(false); } };
  const sheet = async () => {
    setBusy(true); setHint(""); const w = window.open("about:blank", "_blank"); // opened now, inside the click, so the browser allows it
    try {
      const r = await api(`/admin/export?${qs("sheet")}&origin=${encodeURIComponent(window.location.origin)}`); if (!r.ok) throw new Error("export");
      const { html, text } = await r.json() as { html: string; text: string };
      await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) })]);
      if (w) w.location.href = "https://sheets.new"; setHint("copied");
    } catch { w?.close(); await go("xlsx"); } // the browser would not let us copy: download the file instead
    finally { setBusy(false); }
  };
  const cls = "rounded-full border border-sky-border bg-white px-4 py-2 text-sm font-bold hover:bg-sky-pale disabled:opacity-50";
  const note = "basis-full rounded-xl bg-sky-pale px-3 py-2 text-right text-xs font-semibold text-mute";
  const link = "font-bold text-sky-hover underline";
  return (<span className="inline-flex flex-wrap items-center justify-end gap-2"><button type="button" disabled={busy} onClick={() => void sheet()} className={cls}>{t("Export Google Sheet")}</button><button type="button" disabled={busy} onClick={() => go("pdf")} className={cls}>{t("Export PDF")}</button>
    {hint === "copied" && <span role="status" className={note}>Copied! In the new Google Sheet, click cell A1 and press Ctrl+V (Mac: ⌘V). <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className={link}>Open Google Sheets</a> · <button type="button" onClick={() => go("xlsx")} className={link}>Download file instead</button> <button type="button" onClick={() => setHint("")} aria-label="Close" className="ml-1 font-bold">×</button></span>}
    {hint === "file" && <span role="status" className={note}>Your browser would not copy, so the file was downloaded. In Google Sheets choose File &gt; Import &gt; Upload and pick it. <a href="https://docs.google.com/spreadsheets/" target="_blank" rel="noopener noreferrer" className={link}>Open Google Sheets</a> <button type="button" onClick={() => setHint("")} aria-label="Close" className="ml-1 font-bold">×</button></span>}</span>);
}
