// Payment screenshots: stored in a PRIVATE Supabase bucket ("payment-proofs"). Only the admin sees them, through short-lived signed links.
import { db } from "./db";
const BUCKET = "payment-proofs";
let ready = false;
async function ensureBucket() {
  if (ready) return;
  const r = await db().storage.createBucket(BUCKET, { public: false, fileSizeLimit: 5 * 1024 * 1024, allowedMimeTypes: ["image/webp"] });
  if (r.error && !/already exists|duplicate/i.test(r.error.message)) throw new Error(r.error.message);
  ready = true;
}
/** Saves the screenshot and returns its storage path (kept on the order as paymentProof). */
export async function uploadProof(orderNumber: string, bytes: Uint8Array) {
  await ensureBucket();
  const path = `${orderNumber.toLowerCase()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}.webp`;
  const r = await db().storage.from(BUCKET).upload(path, bytes, { contentType: "image/webp", upsert: false });
  if (r.error) throw new Error(r.error.message);
  return path;
}
/** Signed links (valid 1 hour) for the admin pages: { path: url }. */
export async function proofUrls(paths: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {}; const list = [...new Set(paths.filter(Boolean))]; if (!list.length) return out;
  try { const r = await db().storage.from(BUCKET).createSignedUrls(list, 3600);
    for (const x of r.data ?? []) if (x.path && x.signedUrl) out[x.path] = x.signedUrl; } catch { /* bucket not created yet */ }
  return out;
}
export async function deleteProofs(paths: string[]) {
  const list = paths.filter(Boolean); if (list.length) await db().storage.from(BUCKET).remove(list).catch(() => undefined);
}
