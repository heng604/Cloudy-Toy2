import { Link, useLocation } from "react-router-dom";

const LINKS = [["/admin", "Dashboard"], ["/admin/orders", "Orders"], ["/admin/transactions", "Transactions"], ["/admin/products", "Products"], ["/admin/discounts", "Discounts"], ["/admin/stock", "Stock"], ["/admin/pages", "Pages"], ["/admin/settings", "Settings"]] as const;
export default function AdminNav() {
  const path = useLocation().pathname;
  return (<nav aria-label="Admin" className="flex gap-2 overflow-x-auto pb-1">{LINKS.map(([href, label]) => {
    const on = href === "/admin" ? path === "/admin" : path.startsWith(href);
    return <Link key={href} to={href} aria-current={on ? "page" : undefined} className={`whitespace-nowrap rounded-full px-4 py-2 font-semibold ${on ? "bg-sky" : "bg-white border border-sky-border hover:bg-sky-pale"}`}>{label}</Link>;
  })}</nav>);
}
