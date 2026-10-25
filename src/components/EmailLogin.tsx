import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { isAdminEmail } from "@shared/admin";
import { fetchRole } from "@/lib/auth";
/** Email + password sign-in (works without enabling Google in Supabase). `allowSignUp` is off for the admin page. */
export default function EmailLogin({ next = "/account", allowSignUp = true }: { next?: string; allowSignUp?: boolean }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in"); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState(""); const [info, setInfo] = useState(""); const [busy, setBusy] = useState(false);
  const wantsAdmin = next === "/admin" || next.startsWith("/admin/");
  async function submit(e: FormEvent) {
    e.preventDefault(); setErr(""); setInfo("");
    if (!supabase) return setErr("Sign-in is not configured yet. Add the Supabase environment variables.");
    setBusy(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
        if (error) return setErr(error.message);
        if (data.session) return navigate(next, { replace: true });
        return setInfo("Account created. Check your email to confirm it, then sign in.");
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return setErr(error.message);
      const u = data.user;
      if (wantsAdmin && !isAdminEmail(u.email, !!u.email_confirmed_at) && !(await fetchRole())) { await supabase.auth.signOut(); return setErr("That account is not the admin account."); }
      navigate(next, { replace: true });
    } catch { setErr("Something went wrong. Please try again."); } finally { setBusy(false); }
  }
  const field = "w-full rounded-xl border border-sky-border px-4 py-3 text-left";
  return (<form onSubmit={submit} className="space-y-3 text-left">
    <label className="block text-sm font-bold">Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} /></label>
    <label className="block text-sm font-bold">Password<input type="password" required minLength={6} autoComplete={mode === "up" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className={field} /></label>
    {err && <p role="alert" className="text-sm text-red-700">{err}</p>}{info && <p role="status" className="text-sm text-green-700">{info}</p>}
    <button type="submit" disabled={busy} className="min-h-11 w-full rounded-full bg-sky px-6 font-bold hover:bg-sky-hover disabled:opacity-60">{busy ? "Please wait…" : mode === "up" ? "Create account" : "Sign in with email"}</button>
    {allowSignUp && <button type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); setInfo(""); }} className="w-full text-sm underline">{mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}</button>}
  </form>);
}
