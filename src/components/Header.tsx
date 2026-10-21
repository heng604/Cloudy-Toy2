import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { useCart } from "./CartProvider";
import { useI18n, LangSwitch } from "@/lib/i18n";
const NAV = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/shop", label: "Product", match: (p: string) => p.startsWith("/shop") || p.startsWith("/product") },
  { href: "/account", label: "Account", match: (p: string) => p.startsWith("/account") || p.startsWith("/login") },
];
const CART_MATCH = (p: string) => p.startsWith("/cart");
const CartIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.6 12.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 7H6" /></svg>;
export default function Header({ logoUrl = "/img/logo.png" }: { logoUrl?: string }) {
  const { count } = useCart(); const { t, lang } = useI18n();
  const pathname = useLocation().pathname; const navigate = useNavigate();
  const [open, setOpen] = useState(false); const [menu, setMenu] = useState(false);
  const [pill, setPill] = useState({ left: 0, width: 0, show: false });
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => { setMenu(false); }, [pathname]);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  // sliding highlight that follows the page you are on (desktop menu)
  useLayoutEffect(() => {
    const place = () => {
      const el = bar.current?.querySelector<HTMLElement>('[aria-current="page"]');
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth, show: true }); else setPill((p) => ({ ...p, show: false }));
    };
    place(); window.addEventListener("resize", place); document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [pathname, lang, count]);
  const search = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); navigate(`/shop?q=${encodeURIComponent(input.current?.value ?? "")}`); };
  const cartOn = CART_MATCH(pathname);
  const link = "relative z-10 flex items-center gap-1.5 rounded-full px-5 py-2 transition duration-200 hover:-translate-y-0.5 active:scale-95";
  return (
    <header className="sticky top-0 z-50 border-b border-sky-border bg-white/90 backdrop-blur" onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); setMenu(false); } }}>
      <div className="page-wrap flex items-center justify-between gap-2 py-2 sm:gap-4 sm:py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2 text-lg font-extrabold sm:text-xl">
          <img src={logoUrl} alt="" width={44} height={26} className="h-8 w-auto shrink-0 rounded-lg object-cover sm:h-9" /><span className="hidden min-[400px]:inline">Cloudy-Toy</span></Link>
        <nav className="flex items-center gap-0.5 text-sm font-semibold sm:gap-2 sm:text-base">
          <button type="button" aria-label={open ? t("Close search") : t("Open search")} aria-expanded={open} onClick={() => { setOpen(!open); setMenu(false); }} className="grid h-10 w-10 place-items-center rounded-full transition hover:scale-110 hover:bg-sky-pale active:scale-95 sm:h-11 sm:w-11">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">{open ? <path d="M6 6l12 12M18 6L6 18" /> : <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>}</svg>
          </button>
          <LangSwitch className="mx-0.5 sm:mx-1" />
          {/* Desktop / laptop (lg and up): full menu with a highlight that slides to the current page */}
          <div ref={bar} className="relative hidden items-center gap-1 lg:flex">
            <span aria-hidden="true" className={`absolute inset-y-0 rounded-full bg-sky shadow-soft transition-all duration-300 ease-out ${pill.show ? "opacity-100" : "opacity-0"}`} style={{ left: pill.left, width: pill.width }} />
            {NAV.map(({ href, label, match }) => { const on = match(pathname); return (
              <Link key={href} to={href} aria-current={on ? "page" : undefined} className={`${link} ${on ? "font-extrabold text-ink" : "hover:bg-sky-pale"}`}>{t(label)}</Link>); })}
            <Link to="/cart" aria-current={cartOn ? "page" : undefined} className={`${link} ${cartOn ? "font-extrabold text-ink" : "hover:bg-sky-pale"}`}>
              <span className="inline-flex transition-transform duration-200 "><CartIcon /></span>{t("Cart")}
              {count > 0 && <span key={count} className="badge-pop rounded-full bg-sky-hover px-2 text-sm text-ink" aria-label={`${count} items`}>{count}</span>}</Link>
          </div>
          {/* Phone / iPad / tablet (below lg): everything inside the menu icon */}
          <button type="button" aria-label={menu ? t("Close menu") : t("Open menu")} aria-expanded={menu} aria-controls="mobile-menu" onClick={() => { setMenu(!menu); setOpen(false); }} className="relative grid h-10 w-10 place-items-center rounded-full transition hover:bg-sky-pale active:scale-90 sm:h-11 sm:w-11 lg:hidden">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={`transition-transform duration-300 ${menu ? "rotate-90" : ""}`}>{menu ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
            {!menu && count > 0 && <span key={count} className="badge-pop absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-sky-hover px-1 text-[11px] font-extrabold text-ink" aria-label={`${count} items`}>{count}</span>}
          </button>
        </nav>
      </div>
      {menu && (
        <div id="mobile-menu" className="menu-in page-wrap max-h-[calc(100dvh-4rem)] overflow-y-auto pb-3 lg:hidden">
          <ul className="flex flex-col gap-1 text-base font-semibold">
            {[...NAV.map((n) => ({ ...n, cart: false })), { href: "/cart", label: "Cart", match: CART_MATCH, cart: true }].map(({ href, label, match, cart }, i) => { const on = match(pathname); return (
              <li key={href} className="menu-item" style={{ animationDelay: `${i * 60}ms` }}>
                <Link to={href} aria-current={on ? "page" : undefined} className={`flex items-center justify-between rounded-full px-5 py-3 transition duration-200 active:scale-95 ${on ? "bg-sky text-ink shadow-soft font-extrabold translate-x-1" : "hover:bg-sky-pale hover:translate-x-1"}`}>
                  <span className="flex items-center gap-2">{cart && <CartIcon />}{t(label)}</span>
                  {cart && count > 0 && <span key={count} className="badge-pop rounded-full bg-white px-2 text-sm" aria-label={`${count} items`}>{count}</span>}</Link></li>); })}
          </ul>
        </div>
      )}
      {open && (
        <form onSubmit={search} role="search" className="menu-in page-wrap pb-3">
          <input ref={input} type="search" name="q" placeholder={t("Search toys")} aria-label={t("Search toys")} className="w-full rounded-full border border-sky-border bg-page px-5 py-3" />
        </form>
      )}
    </header>
  );
}
