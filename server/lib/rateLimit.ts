// Small in-memory limiter (per server instance) to slow down discount-code guessing.
import type { Request } from "express";
const hits = new Map<string, number[]>();
export function tooMany(key: string, max = 15, windowMs = 60_000) {
  const now = Date.now(); const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now); hits.set(key, recent); if (hits.size > 5000) hits.clear();
  return recent.length > max;
}
export const clientKey = (req: Request) => req.ip ?? "local" // Express resolves the real client through "trust proxy"; a forged X-Forwarded-For can no longer dodge the limits;
