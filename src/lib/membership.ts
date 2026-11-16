// The signed-in customer's membership level. The server adds up their PAID orders; the level and perks come from the admin's Membership page (in the promotions settings).
import { useResource } from "./data";
import { apiJson } from "./api";
import { useAuth } from "./auth";
import { usePromotions } from "./store";
import { nextTier, pointsOf, pointsFor } from "@shared/membership";
export function useMembership() {
  const { user } = useAuth(); const { promotions } = usePromotions();
  const r = useResource<{ spendCents: number; tierId?: string | null; used?: Record<string, number> }>(user ? `membership:${user.id}` : null, () => apiJson("/membership/me"), { staleMs: 10_000 });
  const spendCents = user ? r.data?.spendCents ?? 0 : 0, tiers = promotions.membership, pointCents = promotions.memberPointCents, points = pointsOf(spendCents, tiers, pointCents);
  const next = user ? nextTier(spendCents, tiers) : null;
  return { signedIn: !!user, loading: !!user && r.loading, spendCents, used: (user ? r.data?.used : undefined) ?? {}, tiers, tier: user && r.data ? tiers.find((x) => x.id === r.data!.tierId) ?? null : null, next, pointCents, points, pointsToNext: next ? Math.max(0, pointsFor(next, tiers, pointCents) - points) : 0, pointsOfLevel: (t: (typeof tiers)[number]) => pointsFor(t, tiers, pointCents) };
}
