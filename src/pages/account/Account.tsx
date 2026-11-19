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
    <button type="button" onClick={() => { navigate("/"); void signOut(); }} className="group inline-flex min-h-12 items-center gap-2.5 rounded-full bg-gradient-to-r from-[#FF9DB8] to-[#FF6B8B] px-7 font-display text-base font-extrabold text-white shadow-[0_6px_16px_rgba(255,107,139,.35)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(255,107,139,.45)] hover:brightness-105 active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFC2D1]"><svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 transition-transform duration-150 ease-out group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H9" /><path d="M15 8l4 4-4 4M19 12H9" /></svg>{t("Sign out")}</button></div></div>)}</RequireUser>);
}
