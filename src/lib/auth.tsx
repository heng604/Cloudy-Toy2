import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { isAdminEmail } from "@shared/admin";
type A = { user: User | null; ready: boolean; isAdmin: boolean; signOut: () => Promise<void> };
const Ctx = createContext<A>({ user: null, ready: false, isAdmin: false, signOut: async () => {} });
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [ready, setReady] = useState(!supabase);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { setUser(s?.user ?? null); setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  const isAdmin = !!user && isAdminEmail(user.email, !!user.email_confirmed_at);
  return <Ctx.Provider value={{ user, ready, isAdmin, signOut: async () => { await supabase?.auth.signOut(); } }}>{children}</Ctx.Provider>;
}
