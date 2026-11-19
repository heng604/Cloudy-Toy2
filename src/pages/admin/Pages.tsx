import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n";
import { useSearchParams } from "react-router-dom";
import { PAGE_DEFS, MAX_CONTENT, MAX_TITLE, type PageData } from "@shared/pages";
import DeleteButton from "@/components/admin/DeleteButton";
import Skeleton from "@/components/Skeleton";
import { post } from "@/lib/api";
import { useTitle } from "@/lib/title";
import { useAdmin, refreshAdmin, Msg } from "./hooks";
const btn = "rounded-full border border-sky-border px-4 py-2 text-sm font-bold hover:bg-sky-pale";
const field = "w-full rounded-xl border border-sky-border bg-white px-4 py-3";
/** "Gift Guide 2026" -> "gift-guide-2026" (the web address of the new page). */
const slugOf = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
export default function AdminPages() {
  const { t } = useI18n(); useTitle(t("Pages"), true);
  const [sp, setSp] = useSearchParams(); const { data } = useAdmin<{ pages: Record<string, PageData> }>("/admin/pages");
  const [creating, setCreating] = useState(false); const [title, setTitle] = useState(""); const [slug, setSlug] = useState(""); const [slugEdited, setSlugEdited] = useState(false); const [busy, setBusy] = useState(false);
  if (!data) return <Skeleton />;
  const pages = data.pages;
  const builtin = PAGE_DEFS.map((d) => ({ slug: d.slug as string, title: d.title as string, deletable: d.deletable, custom: false }));
  const custom = Object.keys(pages).filter((k) => pages[k].custom).map((k) => ({ slug: k, title: pages[k].title, deletable: true, custom: true }));
  const defs = [...builtin, ...custom];
  const done = async (r: Response, ok: Record<string, string>) => { const j = await r.json().catch(() => ({})) as { ok?: boolean; error?: string }; refreshAdmin(); setSp(j.ok ? ok : { error: j.error ?? "Could not save" }); window.scrollTo({ top: 0 }); return !!j.ok; };
  const create = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (busy) return; setBusy(true);
    const content = String(new FormData(e.currentTarget).get("content") ?? "");
    const ok = await done(await post("/admin/pages/create", { title, slug, content }), { created: slug });
    setBusy(false); if (ok) { setCreating(false); setTitle(""); setSlug(""); setSlugEdited(false); }
  };
  return (<div className="max-w-3xl space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-extrabold sm:text-3xl">{t("Pages")}</h1>
      <button type="button" onClick={() => setCreating((v) => !v)} className="min-h-11 rounded-full bg-sky px-6 font-bold hover:bg-sky-hover">{creating ? t("Cancel") : "+ New page"}</button></div>
    <p className="text-sm text-mute">Write the text of your shop pages here. Use a line starting with <code>## </code> for a heading, and a blank line between paragraphs. Plain text only. Press <b>+ New page</b> to make your own page (for example a Gift Guide or Store Hours): it gets its own web address and a link in the shop footer. The Contact page also shows your Telegram, Facebook (set in Settings) and email buttons automatically. Shipping Policy and Pre-Order FAQ are the policy pages linked in the footer (the Pre-Order FAQ also shows your current deposit % and dispatch time from Promotions automatically). Deleting a built-in page hides it and removes its footer link (you can restore it any time); deleting a page you created removes it for good.</p>
    <Msg ok={sp.get("saved") ? "Saved" : sp.get("created") ? "New page created. It now shows in the shop footer." : sp.get("deleted") ? "Page deleted" : null} err={sp.get("error")} />
    {creating && <form onSubmit={create} className="space-y-3 rounded-xl2 border-2 border-sky bg-white p-4"><h2 className="text-xl font-extrabold">New page</h2>
      <label className="block space-y-1"><span className="text-sm font-bold">Page title</span>
        <input value={title} onChange={(e) => { setTitle(e.target.value); if (!slugEdited) setSlug(slugOf(e.target.value)); }} required maxLength={MAX_TITLE} placeholder="e.g. Gift Guide" className={field} /></label>
      <label className="block space-y-1"><span className="text-sm font-bold">Web address</span>
        <span className="flex items-center gap-1 text-sm text-mute"><span>{typeof window !== "undefined" ? window.location.origin : ""}/</span><input value={slug} onChange={(e) => { setSlug(slugOf(e.target.value)); setSlugEdited(true); }} required maxLength={40} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="gift-guide" className="min-w-0 flex-1 rounded-xl border border-sky-border bg-white px-3 py-2 text-ink" /></span></label>
      <label className="block space-y-1"><span className="text-sm font-bold">Page text</span>
        <textarea name="content" rows={10} maxLength={MAX_CONTENT} placeholder={"## Heading\n\nWrite your page here…"} className={field} /></label>
      <button disabled={busy || !title.trim() || !slug} className="min-h-11 rounded-full bg-sky px-8 font-bold hover:bg-sky-hover disabled:opacity-50">{busy ? "Creating…" : "Create page"}</button></form>}
    {defs.map((d) => { const p = pages[d.slug]; if (!p) return null; return (<section key={d.slug} className="space-y-3 rounded-xl2 border border-sky-border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-extrabold">{p.title || d.title}{d.custom && <span className="ml-2 rounded-full bg-sky-pale px-2 py-0.5 text-xs font-bold text-ink">Custom</span>}{p.deleted && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">Deleted</span>}</h2>
        <div className="flex gap-2"><a href={`/${d.slug}`} target="_blank" rel="noopener noreferrer" className={btn}>View page</a>
          {d.deletable && (p.deleted ? <button onClick={async () => done(await post(`/admin/pages/${d.slug}/restore`), { saved: d.slug })} className={btn}>Restore</button>
            : <DeleteButton action={async () => { await done(await post(`/admin/pages/${d.slug}/delete`), { deleted: d.slug }); }} message={d.custom ? `Delete the ${p.title} page for good? Its text will be lost.` : `Delete the ${d.title} page? It will be hidden from the shop and its footer link removed.`} />)}</div></div>
      <form key={p.content + p.deleted + p.title} onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget); done(await post("/admin/pages/save", { slug: d.slug, content: f.get("content"), ...(d.custom ? { title: f.get("title") } : {}) }), { saved: d.slug }); }} className="space-y-2">
        {d.custom && <input name="title" defaultValue={p.title} required maxLength={MAX_TITLE} aria-label="Page title" placeholder="Page title" className={field} />}
        <textarea name="content" rows={d.slug === "about" ? 14 : 8} maxLength={MAX_CONTENT} defaultValue={p.content} placeholder={`Write the ${p.title || d.title} page here…`} className={field} />
        <button className="min-h-11 rounded-full bg-sky px-8 font-bold hover:bg-sky-hover">{p.deleted ? "Save and restore" : "Save"}</button></form></section>); })}</div>);
}
