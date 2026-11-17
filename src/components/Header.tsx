import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useCart } from "./CartProvider";
import { useI18n, LangSwitch } from "@/lib/i18n";
import { useSettings } from "@/lib/store";
import { sizeOf } from "@/lib/imageSize";
import { useProfile } from "@/lib/profile";
const NAV = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/shop", label: "Product", match: (p: string) => p.startsWith("/shop") || p.startsWith("/product") },
  { href: "/account", label: "Account", match: (p: string) => p.startsWith("/account") || p.startsWith("/login") },
];
const CART_MATCH = (p: string) => p.startsWith("/cart");
const Svg = ({ children, size = 18 }: { children: ReactNode; size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
const CartIcon = () => <Svg><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.6 12.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 7H6" /></Svg>;
const UserIcon = () => <Svg><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>;
type ItemId = "home" | "product" | "new" | "pre" | "sale";
const ICONS: Record<Exclude<ItemId, "home">, ReactNode> = {
  product: <Svg size={19}><path d="M6 8h12l1.200 12H4.800z" /><path d="M9 10V6.500a3 3 0 0 1 6 0V10" /></Svg>,
  new: <Svg size={19}><path d="M12 3l2.200 5.300L20 9l-4.200 3.900L17 19l-5-2.900L7 19l1.200-6.100L4 9l5.800-.7z" /></Svg>,
  pre: <Svg size={19}><circle cx="12" cy="12" r="8.500" /><path d="M12 7.500V12l3 2" /></Svg>,
  sale: <Svg size={19}><path d="M3 12.500V4h8.500l9 9a1.800 1.800 0 0 1 0 2.500l-5.500 5.500a1.800 1.800 0 0 1-2.500 0z" /><circle cx="7.500" cy="8.500" r="1.300" /></Svg>,
};
/** The shop menu, same order and look as the design: Home, Product, New Arrival, Pre-Order, Special Offer. */
const ITEMS: { id: ItemId; label: string; to: string }[] = [
  { id: "home", label: "Home", to: "/" },
  { id: "product", label: "Product", to: "/shop" },
  { id: "new", label: "New Arrival", to: "/shop?type=new_arrival" },
  { id: "pre", label: "Pre-Order", to: "/shop?type=preorder" },
  { id: "sale", label: "Special Offer", to: "/shop?sale=1" },
];
const ON = "bg-gradient-to-b from-[#5BAEF5] to-[#3D86E0] text-white shadow-[0_5px_12px_rgba(61,134,224,.35)]"; // the Home button colour, used by every header button
const itemCls = (active: boolean) => `relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-extrabold transition duration-200 hover:-translate-y-0.5 active:scale-95 xl:text-sm ${active ? ON : "text-[#1F4E9C] hover:bg-[#E3F0FF]"}`;
const Inner = ({ id, label }: { id: ItemId; label: string }) => <>{id !== "home" && ICONS[id]}{label}</>;
export default function Header({ logoUrl = "/img/logo.png" }: { logoUrl?: string }) {
  const { count } = useCart(); const { profile } = useProfile(); const { t } = useI18n(); const { settings: sz } = useSettings(); const logoK = sizeOf(sz, "logo");
  const loc = useLocation(); const pathname = loc.pathname; const navigate = useNavigate(); const q = new URLSearchParams(loc.search);
  const [open, setOpen] = useState(false); const [menu, setMenu] = useState(false);
  useEffect(() => { setMenu(false); }, [pathname]);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  const search = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); navigate(`/shop?q=${encodeURIComponent(String(new FormData(e.currentTarget).get("q") ?? ""))}`); setOpen(false); };
  const onShop = pathname.startsWith("/shop"); const plain = !q.get("type") && q.get("sale") !== "1" && !q.get("category");
  const isOn = (id: ItemId) => id === "home" ? pathname === "/" : id === "product" ? (onShop && plain) || pathname.startsWith("/product") : id === "new" ? q.get("type") === "new_arrival" : id === "pre" ? q.get("type") === "preorder" : id === "sale" ? q.get("sale") === "1" || pathname.startsWith("/offer") : false;
  const cartOn = CART_MATCH(pathname), acctOn = pathname.startsWith("/account") || pathname.startsWith("/login"), icon = "relative grid h-10 w-10 place-items-center rounded-full text-[#1F4E9C] transition hover:scale-110 hover:bg-[#E3F0FF] active:scale-95 sm:h-11 sm:w-11";
  const links = () => ITEMS.map((it) => <Link key={it.id} to={it.to} aria-current={isOn(it.id) ? "page" : undefined} className={itemCls(isOn(it.id))}><Inner id={it.id} label={t(it.label)} /></Link>);
  return (
    <header className="sticky top-0 z-50 border-b border-[#DCEBFB] bg-white/85 shadow-[0_4px_20px_rgba(74,134,216,.14)] backdrop-blur-md" onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); setMenu(false); } }}>
      <div className="page-wrap flex items-center justify-between gap-3 py-2 xl:py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <img src={logoUrl} alt="" width={56} height={56} style={{ ["--k" as string]: logoK }} className="h-[calc(2.75rem*var(--k))] w-[calc(2.75rem*var(--k))] shrink-0 rounded-full object-cover sm:h-[calc(3.5rem*var(--k))] sm:w-[calc(3.5rem*var(--k))]" />
          <span className="min-w-0 leading-tight"><span className="block truncate font-display text-2xl font-bold text-[#1F3F8F] sm:text-[1.7rem]">Cloudy Toys</span><span className="hidden truncate text-[11px] font-semibold text-[#1F4E9C]/80 min-[400px]:block sm:text-xs">♡ {t("Collect a little happiness")} ♡</span></span></Link>
        <nav aria-label={t("Main menu")} className="hidden items-center gap-0.5 xl:flex">{links()}</nav>
        <div className="flex items-center gap-0.5 sm:gap-1.5">
          <form onSubmit={search} role="search" className="relative mr-1 hidden 2xl:block"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1F4E9C" strokeWidth="2.200" strokeLinecap="round" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.500-3.500" /></svg>
            <input type="search" name="q" key={loc.search} defaultValue={onShop ? q.get("q") ?? "" : ""} placeholder={`${t("Search products")}...`} aria-label={t("Search products")} className="h-10 w-56 rounded-full border-[1.5px] border-[#CFE3F8] bg-white pl-10 pr-4 text-sm shadow-soft placeholder:text-[#1F4E9C]/50 focus:outline-none focus:ring-2 focus:ring-[#4A86D8]/40" /></form>
          <button type="button" aria-label={open ? t("Close search") : t("Open search")} aria-expanded={open} onClick={() => { setOpen(!open); setMenu(false); }} className={`${icon} 2xl:hidden`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">{open ? <path d="M6 6l12 12M18 6L6 18" /> : <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.500-3.500" /></>}</svg></button>
          <LangSwitch className="mx-0.5 sm:mx-1" />
          <Link to="/account" aria-label={t("Account")} title={t("Account")} aria-current={acctOn ? "page" : undefined} className={`${icon} hidden lg:grid ${acctOn ? ON : ""}`}>{profile?.avatar ? <img src={profile.avatar} alt="" className={`h-8 w-8 rounded-full object-cover ring-2 ${acctOn ? "ring-white" : "ring-[#CFE3F8]"}`} /> : <UserIcon />}</Link>
          <Link to="/cart" aria-label={t("Cart")} title={t("Cart")} aria-current={cartOn ? "page" : undefined} className={`${icon} hidden lg:grid ${cartOn ? ON : ""}`}><CartIcon />
            {count > 0 && <span key={count} className="badge-pop absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#FF5C8A] px-1 text-[11px] font-extrabold text-white" aria-label={`${count} items`}>{count}</span>}</Link>
          <button type="button" aria-label={menu ? t("Close menu") : t("Open menu")} aria-expanded={menu} aria-controls="mobile-menu" onClick={() => { setMenu(!menu); setOpen(false); }} className={`${icon} lg:hidden`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={`transition-transform duration-300 ${menu ? "rotate-90" : ""}`}>{menu ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
            {!menu && count > 0 && <span key={count} className="badge-pop absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#FF5C8A] px-1 text-[11px] font-extrabold text-white" aria-label={`${count} items`}>{count}</span>}</button>
        </div>
      </div>
      {/* phone / tablet / small laptop: the same six buttons scroll sideways under the logo; on a wide screen they sit in the top row */}
      <div className="page-wrap flex gap-1.5 overflow-x-auto pb-2 xl:hidden [scrollbar-width:none]">{links()}</div>
      {menu && (
        <div id="mobile-menu" className="menu-in page-wrap max-h-[calc(100dvh-8rem)] overflow-y-auto pb-3 lg:hidden">
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
        <form onSubmit={search} role="search" className="menu-in page-wrap pb-3 2xl:hidden">
          <input ref={input} type="search" name="q" placeholder={t("Search products")} aria-label={t("Search products")} className="w-full rounded-full border border-sky-border bg-white px-5 py-3" />
        </form>
      )}
    </header>
  );
}
