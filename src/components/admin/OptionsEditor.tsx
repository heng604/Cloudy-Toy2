import { useState, type KeyboardEvent } from "react";
import { OPTION_LIMITS, parseOptions, pruneOptionImages, serializeOptions, type OptionGroup } from "@shared/products";
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
/** Admin: the clickable options of a product (Character: Xavier, Zayne ... / Size: ...). Each choice can be linked to one of the product's photos: the shop shows that photo when the customer clicks the choice.
 *  Saved with the product form through a hidden "variants" field. `images` = the photos the product keeps (a removed photo drops its links). */
export default function OptionsEditor({ initial, images = [] }: { initial?: string; images?: { src: string; alt: string }[] }) {
  const { t } = useI18n(); const [groups, setGroups] = useState<OptionGroup[]>(() => parseOptions(initial)); const [open, setOpen] = useState(""); // "groupIndex|choice" whose photo strip is open
  const srcs = images.map((i) => i.src);
  const link = (gi: number, v: string, src: string) => setGroups((a) => a.map((x, n) => { if (n !== gi) return x; const im = { ...x.images }; if (src) im[v] = src; else delete im[v]; return { ...x, images: im }; }));
  const set = (i: number, g: Partial<OptionGroup>) => setGroups((a) => a.map((x, n) => (n === i ? { ...x, ...g } : x)));
  const addValues = (i: number, vs: string[]) => setGroups((a) => a.map((x, n) => (n === i ? { ...x, values: [...new Set([...x.values, ...vs.map((v) => v.slice(0, OPTION_LIMITS.value))])].slice(0, OPTION_LIMITS.values) } : x)));
  return (<div className="space-y-3">
    {/* what is saved: groups with a name and at least one choice (empty ones are dropped by the server) */}
    <input type="hidden" name="variants" value={serializeOptions(pruneOptionImages(groups, srcs))} />
    <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-extrabold">{t("Product Option / Variants")}</h3><span className="text-xs text-mute">{groups.length}/{OPTION_LIMITS.groups}</span></div>
    <p className="text-xs text-mute">{t("Customers click one choice from each group before adding to cart.")}</p>
    {groups.map((g, i) => (<div key={i} className="space-y-2 rounded-xl border border-sky-border bg-[#F3F9FE] p-3">
      <div className="flex items-center gap-2"><input value={g.name} onChange={(e) => set(i, { name: e.target.value })} maxLength={OPTION_LIMITS.name} placeholder={t("Option name (e.g. Character, Size, Color)")} aria-label={t("Option name (e.g. Character, Size, Color)")} className={`${field} font-bold`} />
        <button type="button" onClick={() => setGroups((a) => a.filter((_, n) => n !== i))} aria-label={t("Remove group")} title={t("Remove group")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-mute hover:bg-white hover:text-red-600"><Icon name="trash" size={16} /></button></div>
      {g.values.length > 0 && <ul className="space-y-1.5">{g.values.map((v) => { const src = g.images?.[v] && srcs.includes(g.images[v]) ? g.images[v] : ""; const k = `${i}|${v}`; const isOpen = open === k; return (<li key={v} className="rounded-xl border border-sky-border bg-white p-1.5">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setOpen(isOpen ? "" : k)} aria-expanded={isOpen} aria-label={`${t("Photo for this choice")}: ${v}`} title={t("Photo for this choice")} className={`grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg border-2 ${src ? "border-sky-hover" : "border-dashed border-sky-border text-mute hover:bg-sky-pale"}`}>{src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <Icon name="plus" size={16} />}</button>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{v}</span>
          <button type="button" onClick={() => set(i, { values: g.values.filter((x) => x !== v) })} aria-label={`Remove ${v}`} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-mute hover:bg-red-50 hover:text-red-600">×</button></div>
        {isOpen && <div className="mt-2 rounded-lg bg-[#F3F9FE] p-2">
          {images.length === 0 ? <p className="text-xs text-mute">{t("Add and save the product photos first, then link a photo to each choice.")}</p>
            : <><p className="mb-1.5 text-xs font-bold">{t("Click the photo that shows this choice")}</p>
              <div className="flex flex-wrap gap-2">{images.map((im) => <button key={im.src} type="button" onClick={() => { link(i, v, im.src); setOpen(""); }} aria-label={t("Use this photo")} aria-pressed={src === im.src} className={`h-14 w-14 overflow-hidden rounded-lg border-2 ${src === im.src ? "border-sky-hover" : "border-transparent hover:border-sky-border"}`}><img src={im.src} alt={im.alt} className="h-full w-full object-cover" /></button>)}
                <button type="button" onClick={() => { link(i, v, ""); setOpen(""); }} className="h-14 rounded-lg border-2 border-dashed border-sky-border px-3 text-xs font-bold text-mute hover:bg-white">{t("No photo")}</button></div></>}
        </div>}</li>); })}</ul>}
      <ChoiceAdder full={g.values.length >= OPTION_LIMITS.values} onAdd={(vs) => addValues(i, vs)} />
    </div>))}
    <button type="button" disabled={groups.length >= OPTION_LIMITS.groups} onClick={() => setGroups((a) => [...a, { name: a.length ? "" : "Character", values: [] }])} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-sky-hover bg-white px-3.5 py-2 text-sm font-bold text-sky-hover hover:bg-sky-pale disabled:opacity-50"><Icon name="plus" size={16} />{t("Add option group")}</button>
  </div>);
}
