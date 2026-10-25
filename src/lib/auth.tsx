import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { isAdminEmail } from "@shared/admin";
import type { Role } from "@shared/roles";
import { api } from "./api";
type A = { user: User | null; ready: boolean; isAdmin: boolean; role: Role | null; signOut: () => Promise<void> };
const Ctx = createContext<A>({ user: null, ready: false, isAdmin: false, role: null, signOut: async () => {} });
export const useAuth = () => useContext(Ctx);
/** Asks the server which admin role this signed-in account has (needs the session token). Null = not staff. */
export async function fetchRole(): Promise<Role | null> {
  try { const r = await api("/staff/me"); if (!r.ok) return null; const j = await r.json() as { role?: Role | null }; return j.role ?? null; } catch { return null; }
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [sessionReady, setReady] = useState(!supabase);
  const [role, setRole] = useState<Role | null>(null); const [roleFor, setRoleFor] = useState<string | null>(null); // roleFor = the account id the role above belongs to
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { setUser(s?.user ?? null); setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  const uid = user?.id ?? null, mail = user?.email ?? null, verified = !!user?.email_confirmed_at;
  useEffect(() => {
    if (!uid) { setRole(null); setRoleFor(null); return; }
    if (isAdminEmail(mail, verified)) { setRole("owner"); setRoleFor(uid); return; } // owner emails never wait for the server
    let live = true; setRoleFor((cur) => (cur === uid ? cur : null)); // keep the known role while a token refresh re-runs this
    fetchRole().then((r) => { if (live) { setRole(r); setRoleFor(uid); } });
    return () => { live = false; };
  }, [uid, mail, verified]);
  const roleReady = !user || roleFor === user.id, ready = sessionReady && roleReady;
  const isAdmin = !!user && roleReady && role !== null;
  return <Ctx.Provider value={{ user, ready, isAdmin, role: isAdmin ? role : null, signOut: async () => { await supabase?.auth.signOut(); } }}>{children}</Ctx.Provider>;
}
