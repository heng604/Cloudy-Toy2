// The signed-in customer's membership level. The server adds up their PAID orders; the level and perks come from the admin's Membership page (in the promotions settings).
import { useResource } from "./data";
import { apiJson } from "./api";
import { useAuth } from "./auth";
import { usePromotions } from "./store";
import { tierFor, nextTier } from "@shared/membership";
export function useMembership() {
  const { user } = useAuth(); const { promotions } = usePromotions();
  const r = useResource<{ spendCents: number }>(user ? `membership:${user.id}` : null, () => apiJson("/membership/me"), { staleMs: 10_000 });
  const spendCents = user ? r.data?.spendCents ?? 0 : 0, tiers = promotions.membership;
  return { signedIn: !!user, loading: !!user && r.loading, spendCents, tiers, tier: user ? tierFor(spendCents, tiers) : null, next: user ? nextTier(spendCents, tiers) : null };
}
