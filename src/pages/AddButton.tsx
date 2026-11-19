import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { optionText, type OptionGroup } from "@shared/products";
import { useI18n } from "@/lib/i18n";
/** Quantity + Add to cart. When the product has options (set by the admin), the customer clicks one choice in every group first. */
export default function AddButton({ id, disabled, options = [], onPickImage }: { id: string; disabled: boolean; options?: OptionGroup[]; onPickImage?: (src: string) => void }) {
  const { t } = useI18n(); const { add } = useCart(); const [q, setQ] = useState(1); const [done, setDone] = useState(false);
  const [picks, setPicks] = useState<Record<string, string>>({}); const [missing, setMissing] = useState<string[]>([]);
  const pick = (g: string, v: string) => { setPicks((p) => ({ ...p, [g]: v })); setMissing((m) => m.filter((x) => x !== g)); setDone(false); const src = options.find((x) => x.name === g)?.images?.[v]; if (src) onPickImage?.(src); }; // a choice with a photo (set by the admin) shows that photo in the gallery
  function addToCart() {
    const left = options.filter((g) => !picks[g.name]).map((g) => g.name);
    if (left.length) { setMissing(left); setDone(false); return; }
    add(id, q, options.length ? optionText(options, picks) : undefined); setDone(true);
  }
  return (<div className="space-y-4">
    {options.map((g) => { const bad = missing.includes(g.name); return (
      <div key={g.name} role="radiogroup" aria-label={g.name} aria-invalid={bad || undefined}>
        <p className="mb-2 text-sm"><b>{g.name}:</b> <span className={picks[g.name] ? "font-semibold" : "text-mute"}>{picks[g.name] ?? t("choose one")}</span></p>
        <div className="flex flex-wrap gap-2">{g.values.map((v) => { const on = picks[g.name] === v; return (
          <button key={v} type="button" role="radio" aria-checked={on} onClick={() => pick(g.name, v)}
            className={`min-h-10 rounded-full border-2 px-4 py-1.5 text-sm font-bold transition ${on ? "border-[#4A86D8] bg-sky text-ink shadow-soft" : bad ? "border-red-300 bg-white hover:bg-sky-pale" : "border-sky-border bg-white hover:border-sky-hover hover:bg-sky-pale"}`}>{g.images?.[v] && <img src={g.images[v]} alt="" width={28} height={28} loading="lazy" className="-ml-2 mr-2 inline-block h-7 w-7 rounded-full object-cover align-middle" />}{on && <span aria-hidden="true">✓ </span>}{v}</button>); })}</div>
        {bad && <p role="alert" className="mt-1.5 text-sm font-semibold text-red-600">{t("Please choose a {name}.", { name: g.name.toLowerCase() })}</p>}
      </div>); })}
    <div className="flex items-center gap-3"><label className="sr-only" htmlFor="qty">{t("Quantity")}</label>
      <input id="qty" type="number" min={1} max={20} value={q} onChange={(e) => setQ(Math.max(1, Number(e.target.value) || 1))} className="w-20 rounded-full border border-sky-border px-3 py-2" />
      <button disabled={disabled} onClick={addToCart} className="min-h-11 rounded-full bg-sky px-6 font-bold hover:bg-sky-hover disabled:opacity-50">{t("Add to cart")}</button>
      {done && <span role="status" className="text-sm text-mute">{t("Added to your cart")}{options.length ? ` (${optionText(options, picks)})` : ""}</span>}</div>
  </div>);
}
