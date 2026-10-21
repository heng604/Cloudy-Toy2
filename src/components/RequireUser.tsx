import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import type { ReactNode } from "react";
/** Signed-in customers only. Not signed in => /login. The admin email never uses a customer account: it goes to /admin. */
export default function RequireUser({ children }: { children: (user: NonNullable<ReturnType<typeof useAuth>["user"]>) => ReactNode }) {
  const { user, ready, isAdmin } = useAuth(); const { pathname } = useLocation();
  if (!ready) return <div className="h-64" aria-busy="true" />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return <>{children(user)}</>;
}
