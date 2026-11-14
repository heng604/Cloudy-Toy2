import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { compressFormData } from "@/lib/compress";
import { useI18n } from "@/lib/i18n";
/** One picture the admin can choose, replace or remove. The file is sent as soon as it is chosen; `onChange` gets the saved address ("" when removed).
 *  `fields` are extra form values for the upload (e.g. which category). `removeFields` (optional) makes Remove call the server too. */
export default function ImageUpload({ value, path, fields = {}, removeFields, onChange, label, hint, round = false, fallback = "🖼️" }: { value?: string; path: string; fields?: Record<string, string>; removeFields?: Record<string, string>; onChange: (url: string) => void; label?: string; hint?: string; round?: boolean; fallback?: string }) {
  const { t } = useI18n(); const ref = useRef<HTMLInputElement>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  async function send(extra: Record<string, string>, file?: File) {
    if (busy) return; setBusy(true); setErr("");
    try {
      const fd = new FormData(); for (const [k, v] of Object.entries({ ...fields, ...extra })) fd.set(k, v); if (file) fd.set("image", file);
      const j = await (await api(path, { method: "POST", body: await compressFormData(fd) })).json().catch(() => ({})) as { ok?: boolean; url?: string; error?: string };
      if (j.ok) onChange(j.url ?? ""); else setErr(j.error ?? t("Could not save. Please try again."));
    } catch { setErr(t("Could not reach the server. Please try again.")); } finally { setBusy(false); if (ref.current) ref.current.value = ""; }
  }
  const box = `grid shrink-0 place-items-center overflow-hidden border border-sky-border bg-[#F3F9FE] text-2xl ${round ? "h-14 w-14 rounded-full" : "h-16 w-24 rounded-xl"}`;
  return (<div className="flex items-start gap-3">
    <span className={box}>{value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <span aria-hidden="true">{fallback}</span>}</span>
    <div className="min-w-0 flex-1 space-y-1">{label && <p className="text-sm font-bold">{label}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <label className={`cursor-pointer rounded-full border border-sky-border bg-white px-4 py-1.5 text-xs font-extrabold hover:bg-sky-pale ${busy ? "pointer-events-none opacity-50" : ""}`}>{busy ? t("Saving…") : value ? t("Change picture") : t("Upload picture")}
          <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void send({}, f); }} /></label>
        {value && <button type="button" disabled={busy} onClick={() => (removeFields ? void send(removeFields) : onChange(""))} className="text-xs font-bold text-[#E0456B] hover:underline disabled:opacity-50">{t("Remove")}</button>}</div>
      {hint && <p className="text-xs text-mute">{hint}</p>}{err && <p role="alert" className="text-xs font-semibold text-red-700">{err}</p>}</div></div>);
}
