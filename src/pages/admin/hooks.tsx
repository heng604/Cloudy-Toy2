import { useEffect, useState } from "react";
import { useResource, refreshPrefix } from "@/lib/data";
import { apiJson } from "@/lib/api";
import { refreshStore } from "@/lib/store";
/** Admin data comes from the API (needs the admin token). Keys start with "admin:" so one call refreshes all of them. */
export const useAdmin = <T,>(path: string) => {
  const r = useResource<T>(`admin:${path}`, () => apiJson<T>(path));
  useEffect(() => { if (r.error) window.dispatchEvent(new CustomEvent("admin-load-error", { detail: r.error.message })); }, [r.error]);
  return r;
};
/** Red banner shown by the admin layout when any admin data request fails (instead of grey loading blocks forever). */
export function AdminErrorBanner() {
  const [msg, setMsg] = useState("");
  useEffect(() => { const h = (e: Event) => setMsg(String((e as CustomEvent).detail ?? "")); window.addEventListener("admin-load-error", h); return () => window.removeEventListener("admin-load-error", h); }, []);
  if (!msg) return null;
  return <div role="alert" className="rounded-xl bg-red-100 p-4 text-red-900"><b>Could not load admin data ({msg}).</b> The most common cause is that the database tables are missing: open Supabase &gt; SQL Editor and run <code>supabase/setup_all.sql</code> once, then reload this page. Also check that <code>SUPABASE_SERVICE_ROLE_KEY</code> is set in <code>.env.local</code>. The terminal running <code>npm run dev</code> shows the exact error.</div>;
}
export const refreshAdmin = () => { refreshPrefix("admin:"); refreshStore(); };
export const Msg = ({ ok, err }: { ok?: string | null; err?: string | null }) => <>{ok && <p role="status" className="rounded-xl bg-green-100 p-3">{ok}</p>}{err && <p role="alert" className="rounded-xl bg-red-100 p-3">{err}</p>}</>;
