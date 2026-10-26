// Small in-memory limiter (per server instance) to slow down guessing and flooding.
// NOTE: on Vercel every serverless instance has its own memory, so this is a speed bump, not a hard wall. For a hard limit use Vercel Firewall rate limiting (see SECURITY-CHANGES.md).
import type { Request } from "express";
const hits = new Map<string, number[]>();
export function tooMany(key: string, max = 15, windowMs = 60_000) {
  const now = Date.now(); const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now); hits.set(key, recent);
  if (hits.size > 5000) { // drop expired keys first; only if still full drop the oldest ones. (The old code cleared EVERYTHING, so flooding with many keys wiped every limit.)
    for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] >= windowMs) hits.delete(k);
    for (const k of hits.keys()) { if (hits.size <= 4000) break; hits.delete(k); }
  }
  return recent.length > max;
}
export const clientKey = (req: Request) => req.ip ?? "local"; // Express resolves the real client through "trust proxy"; a forged X-Forwarded-For cannot dodge the limits
