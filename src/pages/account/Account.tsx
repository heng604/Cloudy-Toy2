import { Link, useNavigate } from "react-router-dom";
import RequireUser from "@/components/RequireUser";
import { useAuth } from "@/lib/auth";
import { useResource } from "@/lib/data";
import { apiJson } from "@/lib/api";
import { useTitle } from "@/lib/title";
import { useI18n } from "@/lib/i18n";
import type { StoredOrder } from "@shared/types";
import { MemberHero, ProfileHeader, TierCard, PointsWallet, LevelsGrid } from "@/components/MemberCard";
import PointsHistory from "@/components/PointsHistory";
import GiftExchange from "@/components/GiftExchange";
import { useProfile } from "@/lib/profile";
function OrdersCard({ email }: { email: string }) {
  // same cache key as the Order history page, so opening it afterwards is instant
  const { data } = useResource<{ orders: StoredOrder[] }>(`account:orders:${email}`, () => apiJson("/account/orders"));
  const { t } = useI18n(); const n = data?.orders.length;
  return (<Link to="/account/orders" className="rounded-xl2 border border-sky-border bg-white p-5 font-bold shadow-soft">{t("Order history")}
    {n !== undefined && <span className="mt-1 block text-sm font-normal text-mute">{n === 0 ? t("No orders yet") : t(n === 1 ? "{n} order" : "{n} orders", { n })}</span>}</Link>);
}
export default function Account() {
  const { t } = useI18n(); useTitle("My account"); const { signOut } = useAuth(); const navigate = useNavigate(); const { profile } = useProfile();
  return (<RequireUser>{(user) => (<div className="space-y-4"><MemberHero />
    <ProfileHeader src={profile?.avatar} name={profile?.name || (user.email ?? "").split("@")[0] || t("My account")} email={user.email ?? ""} />
    <div className="mx-auto max-w-5xl space-y-4">
    <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]"><TierCard /><PointsWallet /></div>
    <GiftExchange />
    <PointsHistory />
    <LevelsGrid />
    <div className="grid gap-3 sm:grid-cols-2"><Link to="/account/profile" className="rounded-xl2 border border-sky-border bg-white p-5 font-bold shadow-soft">{t("Profile")}</Link><OrdersCard email={user.email ?? user.id} /></div>
    <button onClick={async () => { await signOut(); navigate("/"); }} className="min-h-11 rounded-full border border-sky-border bg-white px-6 font-bold">{t("Sign out")}</button></div></div>)}</RequireUser>);
}
