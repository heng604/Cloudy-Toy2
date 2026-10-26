import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { download } from "@/lib/api";
/** Buttons that download from the admin-only export route. `params` carries the current filters. */
export default function ExportButtons({ type, params = {} }: { type: "orders" | "transactions" | "delivery" | "products" | "stock"; params?: Record<string, string | undefined> }) {
  const [busy, setBusy] = useState(false); const [sheetHint, setSheetHint] = useState(false); const { t } = useI18n();
  const qs = (format: string) => new URLSearchParams(Object.entries({ type, format, ...params }).filter(([, v]) => v) as [string, string][]).toString();
  const go = async (f: string) => { setBusy(true); try { await download(`/admin/export?${qs(f)}`); if (f === "xlsx") setSheetHint(true); } catch { alert("Could not export. Please try again."); } finally { setBusy(false); } };
  const cls = "rounded-full border border-sky-border bg-white px-4 py-2 text-sm font-bold hover:bg-sky-pale disabled:opacity-50";
  // Google Sheets opens the same .xlsx report (same template as the PDF): File > Import > Upload.
  return (<span className="inline-flex flex-wrap items-center justify-end gap-2"><button type="button" disabled={busy} onClick={() => go("xlsx")} className={cls}>{t("Export Google Sheet")}</button><button type="button" disabled={busy} onClick={() => go("pdf")} className={cls}>{t("Export PDF")}</button>
    {sheetHint && <span role="status" className="basis-full rounded-xl bg-sky-pale px-3 py-2 text-right text-xs font-semibold text-mute">Downloaded. In Google Sheets choose File &gt; Import &gt; Upload and pick the file. <a href="https://docs.google.com/spreadsheets/" target="_blank" rel="noopener noreferrer" className="font-bold text-sky-hover underline">Open Google Sheets</a> <button type="button" onClick={() => setSheetHint(false)} aria-label="Close" className="ml-1 font-bold">×</button></span>}</span>);
}
