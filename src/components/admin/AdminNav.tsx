import { Link, useLocation } from "react-router-dom";
import Icon, { type IconName } from "./Icons";
import { useI18n } from "@/lib/i18n";
const LINKS: [string, string, IconName][] = [["/admin", "Dashboard", "home"], ["/admin/orders", "Orders", "orders"], ["/admin/transactions", "Transactions", "transactions"], ["/admin/products", "Products", "products"], ["/admin/discounts", "Discounts", "discounts"], ["/admin/stock", "Stock", "stock"], ["/admin/pages", "Pages", "pages"], ["/admin/settings", "Settings", "settings"]];
/** Teal icon sidebar. On phones it becomes a scrollable bar across the top. */
export default function AdminNav({ initial, onSignOut }: { initial: string; onSignOut: () => void }) {
  const path = useLocation().pathname; const { t } = useI18n();
  const base = "group relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition md:h-12 md:w-12";
  return (<aside className="flex shrink-0 items-center gap-2 bg-[#1FC2C8] p-2 text-white md:w-[4.75rem] md:flex-col md:gap-3 md:rounded-l-[1.75rem] md:px-0 md:py-5">
    <Link to="/admin" aria-label="Cloudy-Toy" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-lg font-extrabold uppercase text-[#1FC2C8] ring-4 ring-white/40 md:mb-3 md:h-12 md:w-12">{initial}</Link>
    <nav aria-label="Admin" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex-none md:flex-col md:gap-2 md:overflow-visible">{LINKS.map(([href, label, icon]) => {
      const on = href === "/admin" ? path === "/admin" : path.startsWith(href);
      return <Link key={href} to={href} title={t(label)} aria-label={t(label)} aria-current={on ? "page" : undefined} className={`${base} ${on ? "bg-white text-[#1FC2C8] shadow-lg" : "hover:bg-white/20"}`}><Icon name={icon} />
        <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100 md:block">{t(label)}</span></Link>; })}</nav>
    <button type="button" onClick={onSignOut} title={t("Sign out")} aria-label={t("Sign out")} className={`${base} hover:bg-white/20 md:mt-auto`}><Icon name="logout" /></button>
  </aside>);
}
