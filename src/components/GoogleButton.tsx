import { useState } from "react";
import { supabase } from "@/lib/supabase";
/** Google sign-in is opt-in: set VITE_GOOGLE_LOGIN=true once the Google provider is enabled in Supabase (otherwise Supabase shows a raw "provider is not enabled" error page). */
export const GOOGLE_ENABLED = String(import.meta.env.VITE_GOOGLE_LOGIN ?? "").toLowerCase() === "true";
export default function GoogleButton({ next = "/account", label = "Continue with Google" }: { next?: string; label?: string }) {
  const [err, setErr] = useState("");
  if (!GOOGLE_ENABLED) return null;
  async function go() {
    try {
      if (!supabase) throw new Error("not configured");
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
      if (error) setErr(/not enabled/i.test(error.message) ? "Google sign-in is not enabled yet. Use email and password above." : error.message);
    } catch { setErr("Sign-in is not configured yet. Add the Supabase environment variables."); }
  }
  return (<div><button onClick={go} className="min-h-11 rounded-full bg-sky px-6 font-bold hover:bg-sky-hover">{label}</button>{err && <p role="alert" className="mt-2 text-sm text-red-700">{err}</p>}</div>);
}
