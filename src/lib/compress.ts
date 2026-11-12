/** Shrinks photos in the browser BEFORE upload so requests stay under Vercel's ~4.5 MB body limit (up to 10 photos per product).
 *  The server still validates and re-encodes everything (max 1200 px), so this is only a size optimisation. */
async function shrink(file: File, side: number, quality: number): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size === 0) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const scale = Math.min(1, side / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale)), h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d"); if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h); bmp.close?.();
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", quality));
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch { return file; }
}
const BUDGET = 3.6 * 1024 * 1024; // keep the whole request safely below 4.5 MB
/** Replaces every image File in the form data with a smaller copy; if all photos together are still too big, squeezes them harder. */
export async function compressFormData(fd: FormData): Promise<FormData> {
  const entries = [...fd.entries()];
  for (const [side, quality] of [[1600, 0.85], [1200, 0.75], [1000, 0.6], [900, 0.5]] as const) {
    const out = new FormData(); let bytes = 0;
    for (const [k, v] of entries) { if (v instanceof File) { const f = await shrink(v, side, quality); bytes += f.size; out.append(k, f); } else out.append(k, v); }
    if (bytes <= BUDGET || side === 900) return out;
  }
  return fd;
}
