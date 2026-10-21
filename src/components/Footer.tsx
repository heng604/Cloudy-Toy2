import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
const col = "space-y-2"; const h = "mb-3 font-extrabold text-ink"; const a = "block hover:text-ink hover:underline";
export default function Footer({ logoUrl = "/img/logo.png", hidden = [] }: { logoUrl?: string; hidden?: string[] }) {
  const { t } = useI18n();
  return (<footer className="mt-10 border-t border-sky-border sm:mt-16 bg-white text-sm text-mute">
    <div className="page-wrap grid gap-8 py-8 sm:grid-cols-2 sm:py-10 lg:grid-cols-4">
      <div className="space-y-3 lg:col-span-2"><Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-ink"><img src={logoUrl} alt="" width={44} height={26} className="h-9 w-auto rounded-lg object-cover" />Cloudy-Toy</Link>
        <p className="max-w-sm">{t("Little Toys, Big Happiness.")} {t("Thoughtfully chosen toys, delivered across Cambodia.")}</p></div>
      <nav aria-label="Shop" className={col}><p className={h}>{t("Product")}</p><Link to="/shop" className={a}>{t("All toys")}</Link><Link to="/cart" className={a}>{t("Cart")}</Link><Link to="/account" className={a}>{t("My account")}</Link></nav>
      <nav aria-label="Company" className={col}><p className={h}>{t("Company")}</p><Link to="/about" className={a}>{t("About")}</Link>{!hidden.includes("contact") && <Link to="/contact" className={a}>{t("Contact")}</Link>}</nav></div>
    <div className="border-t border-sky-border"><div className="page-wrap flex flex-wrap items-center justify-between gap-2 py-4 text-xs"><span>© {new Date().getFullYear()} Cloudy-Toy. {t("All rights reserved.")}</span><Link to="/admin/login" className="hover:underline">{t("Admin login")}</Link></div></div>
  </footer>);
}
