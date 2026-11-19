// The signed-in customer's membership level, points and gift redemptions. The server works them out from their PAID orders; the levels and perks come from the admin's Membership page (in the promotions settings).
import { useResource } from "./data";
import { apiJson } from "./api";
import { useAuth } from "./auth";
import { usePromotions } from "./store";
import { levelAfter } from "@shared/membership";
import type { Gift, Redemption } from "@shared/gifts";
type Me = { spendCents: number; isMember?: boolean; tierId?: string | null; used?: Record<string, number>; points?: number; earned?: number; spent?: number; redemptions?: Redemption[] };
export function useMembership() {
  const { user } = useAuth(); const { promotions } = usePromotions();
  const r = useResource<Me>(user ? `membership:${user.id}` : null, () => apiJson("/membership/me"), { staleMs: 10_000 });
  const spendCents = user ? r.data?.spendCents ?? 0 : 0, tiers = promotions.membership;
  const tier = user && r.data ? tiers.find((x) => x.id === r.data!.tierId) ?? null : null;
  const next = user && r.data ? levelAfter(tier, tiers) : null;
  return { signedIn: !!user, isMember: !!(user && (r.data?.isMember || tier)), loading: !!user && r.loading, spendCents, used: (user ? r.data?.used : undefined) ?? {}, tiers, tier, next, points: user && (r.data?.isMember || tier) ? Math.max(0, r.data?.points ?? 0) : 0, /* a new account that has not paid for anything is not a member yet: always 0 points */ pointCents: promotions.memberPointCents, redemptions: (user ? r.data?.redemptions : undefined) ?? [], refresh: r.refresh };
}
/** The gifts members can exchange points for. */
export function useGifts() { const r = useResource<{ gifts: Gift[] }>("gifts", () => apiJson("/gifts"), { staleMs: 20_000 }); return { gifts: r.data?.gifts ?? [], loading: r.loading, refresh: r.refresh }; }
