import { useNavigate } from "react-router-dom";
import RequireUser from "@/components/RequireUser";
import { useAuth } from "@/lib/auth";
import { useTitle } from "@/lib/title";
import { useI18n } from "@/lib/i18n";
import { MemberHero, ProfileHeader, TierCard, PointsWallet, LevelsGrid } from "@/components/MemberCard";
import PointsHistory from "@/components/PointsHistory";
import GiftExchange from "@/components/GiftExchange";
import { useProfile } from "@/lib/profile";
export default function Account() {
  const { t } = useI18n(); useTitle("My account"); const { signOut } = useAuth(); const navigate = useNavigate(); const { profile } = useProfile();
  return (<RequireUser>{(user) => (<div className="space-y-4"><MemberHero />
    <ProfileHeader src={profile?.avatar} name={profile?.name || (user.email ?? "").split("@")[0] || t("My account")} email={user.email ?? ""} />
    <div className="mx-auto max-w-5xl space-y-4">
    <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]"><TierCard /><PointsWallet /></div>
    <GiftExchange />
    <PointsHistory />
    <LevelsGrid />
    <button onClick={async () => { await signOut(); navigate("/"); }} className="min-h-11 rounded-full border border-sky-border bg-white px-6 font-bold">{t("Sign out")}</button></div></div>)}</RequireUser>);
}
