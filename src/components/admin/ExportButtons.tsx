import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { download } from "@/lib/api";
/** Buttons that download from the admin-only export route. `params` carries the current filters. */
export default function ExportButtons({ type, params = {} }: { type: "orders" | "transactions" | "products" | "stock"; params?: Record<string, string | undefined> }) {
  const [busy, setBusy] = useState(false); const { t } = useI18n();
  const qs = (format: string) => new URLSearchParams(Object.entries({ type, format, ...params }).filter(([, v]) => v) as [string, string][]).toString();
  const go = async (f: string) => { setBusy(true); try { await download(`/admin/export?${qs(f)}`); } catch { alert("Could not export. Please try again."); } finally { setBusy(false); } };
  const cls = "rounded-full border border-sky-border bg-white px-4 py-2 text-sm font-bold hover:bg-sky-pale disabled:opacity-50";
  return (<span className="inline-flex gap-2"><button type="button" disabled={busy} onClick={() => go("csv")} className={cls}>{t("Export CSV")}</button><button type="button" disabled={busy} onClick={() => go("pdf")} className={cls}>{t("Export PDF")}</button></span>);
}
