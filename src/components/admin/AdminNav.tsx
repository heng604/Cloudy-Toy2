import { Link, useLocation } from "react-router-dom";
import Icon, { type IconName } from "./Icons";
import { useI18n } from "@/lib/i18n";
const LINKS: [string, string, IconName][] = [["/admin", "Dashboard", "home"], ["/admin/orders", "Orders", "orders"], ["/admin/transactions", "Transactions", "transactions"], ["/admin/products", "Products", "products"], ["/admin/discounts", "Discounts", "discounts"], ["/admin/stock", "Stock", "stock"], ["/admin/pages", "Pages", "pages"], ["/admin/settings", "Settings", "settings"]];
/** White sidebar with the shop logo and labelled links. On phones it becomes a scrollable bar across the top. */
export default function AdminNav({ logoUrl, onSignOut }: { logoUrl: string; onSignOut: () => void }) {
  const path = useLocation().pathname; const { t } = useI18n();
  const item = "flex h-11 shrink-0 items-center gap-3 rounded-2xl px-3 text-[15px] font-bold transition md:h-11";
  return (<aside className="flex shrink-0 items-center gap-2 border-b border-sky-border bg-white/90 p-2 md:w-60 md:flex-col md:items-stretch md:gap-1 md:rounded-l-[1.75rem] md:border-b-0 md:border-r md:px-4 md:py-5">
    <Link to="/admin" aria-label="Cloudy Toys" className="flex shrink-0 items-center md:mb-4 md:justify-center"><img src={logoUrl} alt="Cloudy Toys" className="h-10 w-auto rounded-xl object-cover md:h-20" /></Link>
    <nav aria-label="Admin" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex-none md:flex-col md:items-stretch md:overflow-visible">{LINKS.map(([href, label, icon]) => {
      const on = href === "/admin" ? path === "/admin" : path.startsWith(href);
      return <Link key={href} to={href} title={t(label)} aria-current={on ? "page" : undefined} className={`${item} ${on ? "bg-sky-pale text-ink shadow-soft ring-1 ring-sky-border" : "text-mute hover:bg-sky-pale hover:text-ink"}`}><Icon name={icon} size={20} /><span className="hidden md:inline">{t(label)}</span></Link>; })}</nav>
    <div className="hidden md:mt-auto md:block"><div className="relative mb-4 flex items-end gap-2 px-1"><img src="/img/invoice-logo.jpg" alt="" className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-sky-border" /><p className="mb-6 rounded-2xl rounded-bl-sm bg-sky-pale px-3 py-1.5 font-['Caveat'] text-base font-semibold leading-tight text-ink">{t("Good things are coming!")}</p></div></div>
    <Link to="/" title={t("View shop")} className={`${item} text-mute hover:bg-sky-pale hover:text-ink`}><Icon name="shop" size={20} /><span className="hidden md:inline">{t("View shop")}</span></Link>
    <button type="button" onClick={onSignOut} title={t("Sign out")} className={`${item} text-mute hover:bg-sky-pale hover:text-ink`}><Icon name="logout" size={20} /><span className="hidden md:inline">{t("Sign out")}</span></button>
  </aside>);
}
