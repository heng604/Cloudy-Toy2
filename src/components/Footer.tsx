import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { useSettings, usePages } from "@/lib/store";
import { TELEGRAM_FALLBACK } from "@/lib/supabase";
import CloudMascot from "./CloudMascot";
const link = "whitespace-nowrap transition hover:text-[#1F4E9C] hover:underline";
const Dot = () => <span aria-hidden="true" className="hidden h-3 w-px bg-[#B9D2EC] sm:block" />;
/** Cloud-shaped scalloped top edge of the footer. */
const SCALLOP = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="34" viewBox="0 0 120 34" fill="#E3F0FF"><rect y="20" width="120" height="14"/><circle cx="20" cy="20" r="14"/><circle cx="50" cy="18" r="17"/><circle cx="88" cy="20" r="14"/></svg>`;
const Line = ({ children }: { children: ReactNode }) => <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2F6FD0" strokeWidth="1.800" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">{children}</svg>;
const FEATURES: { icon: ReactNode; a: string; b: string }[] = [
  { icon: <Line><path d="M12 3l7 3v5c0 4.500-3 8.200-7 10-4-1.800-7-5.500-7-10V6z" /><path d="M9 12l2.200 2.200L15.500 10" /></Line>, a: "100% Authentic", b: "Official Products" },
  { icon: <Line><path d="M2 6h11v10H2z" /><path d="M13 9h4l3 3v4h-7" /><circle cx="6.500" cy="17.500" r="1.800" /><circle cx="16.500" cy="17.500" r="1.800" /></Line>, a: "Delivery Across Cambodia", b: "Careful and on time" },
  { icon: <Line><rect x="2.500" y="5" width="19" height="14" rx="2.500" /><path d="M2.500 10h19M6 15h4" /></Line>, a: "Secure Payment", b: "Multiple Methods" },
  { icon: <Line><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="13" width="4" height="6" rx="1.500" /><rect x="17" y="13" width="4" height="6" rx="1.500" /><path d="M19 19c0 1.500-2 2.500-5 2.500" /></Line>, a: "Friendly Support", b: "We're here to help!" },
];
/** Round dark-blue social buttons with white brand icons. */
const Round = ({ href, label, children }: { href: string; label: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="grid h-9 w-9 place-items-center rounded-full bg-[#1F4E9C] text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-[#2F6FD0]">{children}</a>);
const TelegramIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.600 4.200 3.300 10.900c-.9.300-.9 1.200 0 1.500l4.200 1.300 1.600 5c.2.600.9.700 1.300.3l2.300-2.100 4.300 3.200c.6.400 1.300.1 1.500-.6l2.900-14.200c.2-.9-.6-1.500-1.400-1.100zM9.300 13.300l8.600-5.400c.3-.2.500.2.300.4l-7 6.400-.3 3.200z" /></svg>;
const InstagramIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3.500" y="3.500" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.200" cy="6.800" r="1" fill="currentColor" stroke="none" /></svg>;
const FacebookIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.600 21v-8h2.700l.5-3.200h-3.200V7.900c0-.9.400-1.700 1.800-1.700h1.500V3.400s-1.300-.2-2.600-.2c-2.600 0-4.300 1.600-4.300 4.400v2.200H7.300V13h2.700v8z" /></svg>;
/** Footer in the shop style: cloud edge, thank-you note with the cloud mascots, four promises, round social buttons, then the policy links and copyright. Policy pages are written by the admin in Admin > Pages. */
export default function Footer({ hidden = [] }: { logoUrl?: string; hidden?: string[] }) {
  const { t } = useI18n(); const { settings: s } = useSettings(); const { links: extra } = usePages(); const tg = s.telegramUrl || TELEGRAM_FALLBACK;
  return (<footer className="relative mt-10 text-xs text-[#2F4D7A]">
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-[33px] h-[34px]" style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(SCALLOP)}")`, backgroundRepeat: "repeat-x", backgroundSize: "auto 34px" }} />
    <div className="bg-[#E3F0FF]">
      <div className="page-wrap pb-3 pt-6">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 pb-4"><Link to="/shop" className={link}>{t("All Product")}</Link><Link to="/cart" className={link}>{t("Cart")}</Link><Link to="/account" className={link}>{t("My account")}</Link><Link to="/about" className={link}>{t("About")}</Link><Link to="/admin/login" className={link}>{t("Admin login")}</Link></div>
        <div className="flex flex-col items-center gap-5 rounded-[2rem] border-2 border-white/80 bg-white/60 px-4 py-4 shadow-soft lg:flex-row lg:justify-between lg:px-6">
          <div className="flex shrink-0 items-center gap-3"><Link to="/" aria-label="Cloudy Toys" className="shrink-0"><CloudMascot className="h-14 w-16" /></Link><p className="font-['Caveat'] text-2xl font-semibold leading-tight text-[#1F4E9C]">{t("Thank you")}<br />{t("for being here")} ♡</p></div>
          <ul className="grid w-full grid-cols-2 gap-x-3 gap-y-4 lg:w-auto lg:grid-cols-4 lg:gap-0">
            {FEATURES.map((f, i) => <li key={f.a} className={`flex items-center gap-2.5 lg:px-5 ${i > 0 ? "lg:border-l lg:border-[#C9DDF3]" : ""}`}>{f.icon}<div><p className="text-[13px] font-extrabold leading-tight text-[#1F3F8F]">{t(f.a)}</p><p className="text-[11px] leading-tight text-[#4A6FA5]">{t(f.b)}</p></div></li>)}
          </ul>
          <div className="flex shrink-0 items-center gap-2.5">
            {tg && <Round href={tg} label="Telegram"><TelegramIcon /></Round>}
            {s.instagramUrl && <Round href={s.instagramUrl} label="Instagram"><InstagramIcon /></Round>}
            {s.facebookUrl && <Round href={s.facebookUrl} label="Facebook"><FacebookIcon /></Round>}
            <CloudMascot className="ml-2 hidden h-14 w-16 lg:block" />
          </div>
        </div>
        <nav aria-label="Policies and contact" className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {!hidden.includes("shipping") && <Link to="/shipping" className={link}>{t("Shipping Policy")}</Link>}
          {!hidden.includes("shipping") && !hidden.includes("preorder") && <Dot />}
          {!hidden.includes("preorder") && <Link to="/preorder" className={link}>{t("Pre-Order FAQ")}</Link>}
          {!hidden.includes("contact") && <><Dot /><Link to="/contact" className={link}>{t("Contact Us")}</Link></>}
          {extra.map((l) => <span key={l.slug} className="contents"><Dot /><Link to={`/${l.slug}`} className={link}>{l.title}</Link></span>)}
        </nav>
        <p className="mt-3 text-center text-[11px] text-[#4A6FA5]">© {new Date().getFullYear()} Cloudy Toys · {t("Cute Toys & Accessories")} · {t("All rights reserved.")}</p>
      </div>
    </div>
  </footer>);
}
