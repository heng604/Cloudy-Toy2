// The signed-in customer's own profile (name, phone, address, Facebook, Telegram, photo), kept in the shared cache so the header, account page and profile page agree.
import { useResource } from "./data";
import { apiJson } from "./api";
import { useAuth } from "./auth";
import type { ProfileInfo } from "@shared/profile";
export function useProfile() {
  const { user } = useAuth();
  const r = useResource<{ profile: ProfileInfo; email: string }>(user ? `profile:${user.id}` : null, () => apiJson("/account/profile"), { staleMs: 30_000 });
  return { profile: user ? r.data?.profile ?? null : null, loading: !!user && r.loading, refresh: r.refresh };
}
