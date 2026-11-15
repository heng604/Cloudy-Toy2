import { useState, type KeyboardEvent } from "react";
import { OPTION_LIMITS, parseOptions, serializeOptions, type OptionGroup } from "@shared/products";
import { useI18n } from "@/lib/i18n";
import Icon from "./Icons";
const field = "w-full rounded-xl border border-sky-border bg-white px-3.5 py-2 outline-none";
/** One input that adds choices: Enter, comma, the Add button or leaving the box all add them (so typed text is never lost when the admin presses Save). Pasting "A, B, C" adds three. */
function ChoiceAdder({ full, onAdd }: { full: boolean; onAdd: (v: string[]) => void }) {
  const { t } = useI18n(); const [txt, setTxt] = useState("");
  const commit = () => { const v = txt.split(/[,\n]/).map((x) => x.trim()).filter(Boolean); if (v.length) onAdd(v); setTxt(""); };
  const key = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); } }; // Enter must not submit the whole product form
  return (<div className="flex gap-2"><input value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={key} onBlur={commit} disabled={full} maxLength={OPTION_LIMITS.value * 6} placeholder={t("Type a choice, then press Enter")} aria-label={t("Add a choice")} className={`${field} py-1.5 text-sm`} />
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={commit} disabled={full || !txt.trim()} className="shrink-0 rounded-xl bg-sky px-3.5 text-sm font-bold hover:bg-sky-hover disabled:opacity-50">{t("Add a choice")}</button></div>);
}
/** Admin: the clickable options of a product (Character: Xavier, Zayne ... / Size: ...). Saved with the product form through a hidden "variants" field. */
export default function OptionsEditor({ initial }: { initial?: string }) {
  const { t } = useI18n(); const [groups, setGroups] = useState<OptionGroup[]>(() => parseOptions(initial));
  const set = (i: number, g: Partial<OptionGroup>) => setGroups((a) => a.map((x, n) => (n === i ? { ...x, ...g } : x)));
  const addValues = (i: number, vs: string[]) => setGroups((a) => a.map((x, n) => (n === i ? { ...x, values: [...new Set([...x.values, ...vs.map((v) => v.slice(0, OPTION_LIMITS.value))])].slice(0, OPTION_LIMITS.values) } : x)));
  return (<div className="space-y-3">
    {/* what is saved: groups with a name and at least one choice (empty ones are dropped by the server) */}
    <input type="hidden" name="variants" value={serializeOptions(groups)} />
    <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-extrabold">{t("Product Option / Variants")}</h3><span className="text-xs text-mute">{groups.length}/{OPTION_LIMITS.groups}</span></div>
    <p className="text-xs text-mute">{t("Customers click one choice from each group before adding to cart.")}</p>
    {groups.map((g, i) => (<div key={i} className="space-y-2 rounded-xl border border-sky-border bg-[#F3F9FE] p-3">
      <div className="flex items-center gap-2"><input value={g.name} onChange={(e) => set(i, { name: e.target.value })} maxLength={OPTION_LIMITS.name} placeholder={t("Option name (e.g. Character, Size, Color)")} aria-label={t("Option name (e.g. Character, Size, Color)")} className={`${field} font-bold`} />
        <button type="button" onClick={() => setGroups((a) => a.filter((_, n) => n !== i))} aria-label={t("Remove group")} title={t("Remove group")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-mute hover:bg-white hover:text-red-600"><Icon name="trash" size={16} /></button></div>
      {g.values.length > 0 && <ul className="flex flex-wrap gap-2">{g.values.map((v) => (<li key={v} className="inline-flex items-center gap-1 rounded-full border border-sky-border bg-white py-1 pl-3 pr-1 text-sm font-semibold">{v}
        <button type="button" onClick={() => set(i, { values: g.values.filter((x) => x !== v) })} aria-label={`Remove ${v}`} className="grid h-6 w-6 place-items-center rounded-full text-mute hover:bg-red-50 hover:text-red-600">×</button></li>))}</ul>}
      <ChoiceAdder full={g.values.length >= OPTION_LIMITS.values} onAdd={(vs) => addValues(i, vs)} />
    </div>))}
    <button type="button" disabled={groups.length >= OPTION_LIMITS.groups} onClick={() => setGroups((a) => [...a, { name: a.length ? "" : "Character", values: [] }])} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-sky-hover bg-white px-3.5 py-2 text-sm font-bold text-sky-hover hover:bg-sky-pale disabled:opacity-50"><Icon name="plus" size={16} />{t("Add option group")}</button>
  </div>);
}
