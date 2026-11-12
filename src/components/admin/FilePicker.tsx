import { useRef, useState, type DragEvent } from "react";
/** Friendly "choose file" box for the admin: dashed drop zone, round button, live thumbnails and file names.
 *  With `multiple`, every choose / drop ADDS to the photos already picked (up to `max`), and each photo has its own remove button. */
export default function FilePicker({ name, multiple = false, accept = "image/png,image/jpeg,image/webp", label, max = 10 }: { name: string; multiple?: boolean; accept?: string; label?: string; max?: number }) {
  const ref = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
  const [over, setOver] = useState(false); const [note, setNote] = useState("");
  const limit = multiple ? Math.max(0, max) : 1;
  /** Replace the picked list and mirror it into the real <input> so the form submits exactly these files. */
  const apply = (next: File[]) => {
    files.forEach((f) => URL.revokeObjectURL(f.url));
    if (ref.current) { const dt = new DataTransfer(); next.forEach((f) => dt.items.add(f)); ref.current.files = dt.files; }
    setFiles(next.map((file) => ({ file, url: URL.createObjectURL(file) })));
  };
  const add = (incoming: File[]) => {
    const ok = incoming.filter((f) => accept.split(",").includes(f.type));
    const base = multiple ? files.map((f) => f.file) : [];
    const room = limit - base.length;
    const merged = [...base, ...ok.slice(0, Math.max(0, room))];
    setNote(ok.length < incoming.length ? "Only JPG, PNG or WebP photos can be added." : ok.length > room ? `Only ${limit} photo${limit === 1 ? "" : "s"} allowed here (maximum 10 per product). Extra photos were skipped.` : "");
    apply(merged);
  };
  const drop = (e: DragEvent) => { e.preventDefault(); setOver(false); add(Array.from(e.dataTransfer.files)); };
  const clear = () => { setNote(""); apply([]); };
  const removeAt = (i: number) => { setNote(""); apply(files.filter((_, n) => n !== i).map((f) => f.file)); };
  return (<div>
    <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={drop}
      className={`flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-colors ${over ? "border-[#6CB8F5] bg-[#E3F6F8]" : "border-[#BFE6EA] bg-[#F3FBFC]"}`}>
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[#DDF3F7] text-[#6CB8F5]" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5M12 15V4M7.5 8.5 12 4l4.5 4.5" /></svg></span>
      <p className="text-sm text-mute">{label ?? (multiple ? "Drag photos here, or" : "Drag a photo here, or")}</p>
      <button type="button" disabled={limit === 0 || (multiple && files.length >= limit)} onClick={() => ref.current?.click()} className="min-h-10 rounded-full bg-sky px-6 text-sm font-bold shadow-soft hover:bg-sky-hover disabled:opacity-50">{files.length ? (multiple ? "Add more photos" : "Choose a different photo") : (multiple ? "Choose photos" : "Choose photo")}</button>
      <p className="text-xs text-mute">JPG, PNG or WebP · max 5 MB each{multiple ? ` · ${files.length}/${limit} new` : ""}</p>
      {/* the picker itself is only a doorway: chosen files are copied into `files`, then the input is refilled with the full list */}
      <input ref={ref} name={name} type="file" multiple={multiple} accept={accept} onChange={(e) => { const picked = Array.from(e.target.files ?? []); if (!picked.length) return; if (multiple) { const keep = files.map((f) => f.file); e.target.value = ""; const dt = new DataTransfer(); keep.forEach((f) => dt.items.add(f)); e.target.files = dt.files; } add(picked); }} className="sr-only" tabIndex={-1} />
    </div>
    {note && <p role="status" className="mt-2 text-xs font-semibold text-red-700">{note}</p>}
    {files.length > 0 && <div className="mt-3 flex flex-wrap items-start gap-3">
      {files.map((f, i) => <figure key={f.url} className="relative w-24 text-center"><img src={f.url} alt={f.file.name} className="h-20 w-24 rounded-xl border border-sky-border object-cover" />
        <button type="button" onClick={() => removeAt(i)} aria-label={`Remove ${f.file.name}`} className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-bold text-red-600 shadow-soft hover:bg-red-50">×</button>
        <figcaption className="mt-1 truncate text-[11px] text-mute" title={f.file.name}>{f.file.name}</figcaption><span className="text-[11px] text-mute">{Math.max(1, Math.round(f.file.size / 1024))} KB</span></figure>)}
      <button type="button" onClick={clear} className="rounded-full border border-sky-border px-3 py-1 text-xs font-bold hover:bg-sky-pale">Clear</button></div>}
  </div>);
}
