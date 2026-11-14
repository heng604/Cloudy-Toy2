import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useCart } from "./CartProvider";
import { useI18n, LangSwitch } from "@/lib/i18n";
import { useListedProducts } from "@/lib/store";
import { categoriesOf } from "@shared/products";
const NAV = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/shop", label: "Product", match: (p: string) => p.startsWith("/shop") || p.startsWith("/product") },
  { href: "/account", label: "Account", match: (p: string) => p.startsWith("/account") || p.startsWith("/login") },
];
const CART_MATCH = (p: string) => p.startsWith("/cart");
const Svg = ({ children, size = 18 }: { children: ReactNode; size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
const CartIcon = () => <Svg><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.6 12.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 7H6" /></Svg>;
const UserIcon = () => <Svg><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>;
type ItemId = "home" | "product" | "new" | "pre" | "cat" | "sale";
const ICONS: Record<Exclude<ItemId, "home">, ReactNode> = {
  product: <Svg size={19}><path d="M6 8h12l1.200 12H4.800z" /><path d="M9 10V6.500a3 3 0 0 1 6 0V10" /></Svg>,
  new: <Svg size={19}><path d="M12 3l2.200 5.300L20 9l-4.200 3.900L17 19l-5-2.900L7 19l1.200-6.100L4 9l5.800-.7z" /></Svg>,
  pre: <Svg size={19}><circle cx="12" cy="12" r="8.500" /><path d="M12 7.500V12l3 2" /></Svg>,
  cat: <Svg size={19}><rect x="4" y="4" width="6.500" height="6.500" rx="1.500" /><rect x="13.500" y="4" width="6.500" height="6.500" rx="1.500" /><rect x="4" y="13.500" width="6.500" height="6.500" rx="1.500" /><rect x="13.500" y="13.500" width="6.500" height="6.500" rx="1.500" /></Svg>,
  sale: <Svg size={19}><path d="M3 12.500V4h8.500l9 9a1.800 1.800 0 0 1 0 2.500l-5.500 5.500a1.800 1.800 0 0 1-2.500 0z" /><circle cx="7.500" cy="8.500" r="1.300" /></Svg>,
};
/** The shop menu, same order and look as the design: Home, Product, New Arrival, Pre-Order, Category, Special Offer. `on` = how the item looks on its own page. */
const ITEMS: { id: ItemId; label: string; to: string; on: string }[] = [
  { id: "home", label: "Home", to: "/", on: "bg-[#4A86D8] text-white shadow-soft" },
  { id: "product", label: "Product", to: "/shop", on: "bg-[#D6ECFF] text-[#2F7FC6]" },
  { id: "new", label: "New Arrival", to: "/shop?type=new_arrival", on: "bg-[#D6ECFF] text-[#2F7FC6]" },
  { id: "pre", label: "Pre-Order", to: "/shop?type=preorder", on: "bg-[#FFEFC2] text-[#B98A0B]" },
  { id: "cat", label: "Category", to: "/shop", on: "bg-[#FFD9E6] text-[#D9467A]" },
  { id: "sale", label: "Special Offer", to: "/shop?sale=1", on: "bg-[#E6DCFB] text-[#7A4FD0]" },
];
const itemCls = (active: boolean, on: string) => `relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-extrabold transition duration-200 hover:-translate-y-0.5 active:scale-95 xl:text-sm ${active ? on : "text-[#1F4E9C] hover:bg-white/80"}`;
const Inner = ({ id, label }: { id: ItemId; label: string }) => <>{id !== "home" && ICONS[id]}{label}</>;
/** "Category" on a computer: opens the list of categories. */
function CategoryItem({ active, cats, label }: { active: boolean; cats: string[]; label: string }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null); const { t } = useI18n(); const it = ITEMS[4];
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); }, key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open]);
  return (<div ref={ref} className="relative"><button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={itemCls(active || open, it.on)}><Inner id="cat" label={label} /><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg></button>
    {open && <ul role="menu" className="absolute left-0 top-full z-50 mt-2 max-h-80 min-w-48 overflow-y-auto rounded-2xl border border-sky-border bg-white p-1 shadow-lift">
      {[{ label: t("All"), to: "/shop" }, ...cats.map((c) => ({ label: c, to: `/shop?category=${encodeURIComponent(c)}` }))].map((i) => <li key={i.to} role="none"><Link role="menuitem" to={i.to} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-2 font-semibold hover:bg-sky-pale">{i.label}</Link></li>)}</ul>}</div>);
}
export default function Header({ logoUrl = "/img/logo.png" }: { logoUrl?: string }) {
  const { count } = useCart(); const { t } = useI18n(); const { data: products } = useListedProducts();
  const loc = useLocation(); const pathname = loc.pathname; const navigate = useNavigate(); const q = new URLSearchParams(loc.search);
  const [open, setOpen] = useState(false); const [menu, setMenu] = useState(false);
  useEffect(() => { setMenu(false); }, [pathname]);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  const search = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); navigate(`/shop?q=${encodeURIComponent(String(new FormData(e.currentTarget).get("q") ?? ""))}`); setOpen(false); };
  const cats = categoriesOf(products ?? []); const onShop = pathname.startsWith("/shop"); const plain = !q.get("type") && q.get("sale") !== "1" && !q.get("category");
  const isOn = (id: ItemId) => id === "home" ? pathname === "/" : id === "product" ? (onShop && plain) || pathname.startsWith("/product") : id === "new" ? q.get("type") === "new_arrival" : id === "pre" ? q.get("type") === "preorder" : id === "sale" ? q.get("sale") === "1" || pathname.startsWith("/offer") : onShop && !!q.get("category");
  const cartOn = CART_MATCH(pathname), icon = "relative grid h-10 w-10 place-items-center rounded-full text-[#1F4E9C] transition hover:scale-110 hover:bg-white active:scale-95 sm:h-11 sm:w-11";
  const links = (dropdown: boolean) => ITEMS.map((it) => it.id === "cat" && dropdown
    ? <CategoryItem key={it.id} active={isOn(it.id)} cats={cats} label={t(it.label)} />
    : <Link key={it.id} to={it.to} aria-current={isOn(it.id) ? "page" : undefined} className={itemCls(isOn(it.id), it.on)}><Inner id={it.id} label={t(it.label)} /></Link>);
  return (
    <header className="sticky top-0 z-50 border-b border-white/80 bg-gradient-to-b from-[#E6F2FF]/95 to-[#F4FAFF]/95 shadow-[0_2px_14px_rgba(110,160,225,.18)] backdrop-blur" onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); setMenu(false); } }}>
      <div className="page-wrap flex items-center justify-between gap-3 py-2 xl:py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <img src={logoUrl} alt="" width={56} height={56} className="h-11 w-11 shrink-0 rounded-full object-cover sm:h-14 sm:w-14" />
          <span className="min-w-0 leading-tight"><span className="block truncate font-['Caveat'] text-3xl font-bold text-[#1F4E9C] sm:text-4xl">Cloudy Toys</span><span className="hidden truncate text-xs text-[#1F4E9C]/80 min-[400px]:block sm:text-sm">♡ {t("Collect a little happiness")} ♡</span></span></Link>
        <nav aria-label={t("Main menu")} className="hidden items-center gap-0.5 xl:flex">{links(true)}</nav>
        <div className="flex items-center gap-0.5 sm:gap-1.5">
          <form onSubmit={search} role="search" className="relative mr-1 hidden 2xl:block"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1F4E9C" strokeWidth="2.200" strokeLinecap="round" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.500-3.500" /></svg>
            <input type="search" name="q" key={loc.search} defaultValue={onShop ? q.get("q") ?? "" : ""} placeholder={`${t("Search products")}...`} aria-label={t("Search products")} className="h-10 w-56 rounded-full border border-sky-border bg-white/90 pl-10 pr-4 text-sm shadow-soft placeholder:text-[#1F4E9C]/50 focus:outline-none focus:ring-2 focus:ring-[#4A86D8]/40" /></form>
          <button type="button" aria-label={open ? t("Close search") : t("Open search")} aria-expanded={open} onClick={() => { setOpen(!open); setMenu(false); }} className={`${icon} 2xl:hidden`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">{open ? <path d="M6 6l12 12M18 6L6 18" /> : <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.500-3.500" /></>}</svg></button>
          <LangSwitch className="mx-0.5 sm:mx-1" />
          <Link to="/account" aria-label={t("Account")} title={t("Account")} aria-current={pathname.startsWith("/account") || pathname.startsWith("/login") ? "page" : undefined} className={`${icon} hidden lg:grid`}><UserIcon /></Link>
          <Link to="/cart" aria-label={t("Cart")} title={t("Cart")} aria-current={cartOn ? "page" : undefined} className={`${icon} hidden lg:grid ${cartOn ? "bg-white shadow-soft" : ""}`}><CartIcon />
            {count > 0 && <span key={count} className="badge-pop absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#FF8FAE] px-1 text-[11px] font-extrabold text-white" aria-label={`${count} items`}>{count}</span>}</Link>
          <button type="button" aria-label={menu ? t("Close menu") : t("Open menu")} aria-expanded={menu} aria-controls="mobile-menu" onClick={() => { setMenu(!menu); setOpen(false); }} className={`${icon} lg:hidden`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={`transition-transform duration-300 ${menu ? "rotate-90" : ""}`}>{menu ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
            {!menu && count > 0 && <span key={count} className="badge-pop absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#FF8FAE] px-1 text-[11px] font-extrabold text-white" aria-label={`${count} items`}>{count}</span>}</button>
        </div>
      </div>
      {/* phone / tablet / small laptop: the same six buttons scroll sideways under the logo; on a wide screen they sit in the top row */}
      <div className="page-wrap flex gap-1.5 overflow-x-auto pb-2 xl:hidden [scrollbar-width:none]">{links(false)}</div>
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
