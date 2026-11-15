import { useCallback, useEffect, useState } from "react";
/** Heart button on the product cards: remembers the hearted products in this browser only (no account needed). */
const KEY = "cloudy-wishlist";
const read = (): string[] => { try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []; } catch { return []; } };
const subs = new Set<() => void>();
export function useWishlist() {
  const [ids, setIds] = useState<string[]>(read);
  useEffect(() => { const f = () => setIds(read()); subs.add(f); window.addEventListener("storage", f); return () => { subs.delete(f); window.removeEventListener("storage", f); }; }, []);
  const toggle = useCallback((id: string) => { const cur = read(); const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]; try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode: ignore */ } subs.forEach((f) => f()); }, []);
  return { has: (id: string) => ids.includes(id), toggle };
}
