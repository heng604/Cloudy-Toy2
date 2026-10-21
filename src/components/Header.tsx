import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCart } from "./CartProvider";
const NAV = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/shop", label: "Shop", match: (p: string) => p.startsWith("/shop") || p.startsWith("/product") },
  { href: "/account", label: "Account", match: (p: string) => p.startsWith("/account") || p.startsWith("/login") },
];
export default function Header({ logoUrl = "/img/logo.png" }: { logoUrl?: string }) {
  const { count } = useCart();
  const pathname = useLocation().pathname; const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  const search = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); navigate(`/shop?q=${encodeURIComponent(input.current?.value ?? "")}`); };
  return (
    <header className="sticky top-0 z-30 border-b border-sky-border bg-white/90 backdrop-blur" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold">
          <img src={logoUrl} alt="" width={44} height={26} className="h-9 w-auto rounded-lg object-cover" />Cloudy-Toy</Link>
        <nav className="flex items-center gap-1 font-semibold sm:gap-2">
          <button type="button" aria-label={open ? "Close search" : "Open search"} aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-sky-pale">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">{open ? <path d="M6 6l12 12M18 6L6 18" /> : <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>}</svg>
          </button>
          {NAV.map(({ href, label, match }) => { const on = match(pathname); return (
            <Link key={href} to={href} aria-current={on ? "page" : undefined} className={`rounded-full px-3 py-2 transition-colors sm:px-4 ${on ? "bg-sky text-ink shadow-soft" : "hover:bg-sky-pale"}`}>{label}</Link>); })}
          <Link to="/cart" aria-current={pathname.startsWith("/cart") ? "page" : undefined} className={`relative rounded-full px-4 py-2 transition-colors ${pathname.startsWith("/cart") ? "bg-sky-hover ring-2 ring-ink/20" : "bg-sky hover:bg-sky-hover"}`}>Cart
            {count > 0 && <span className="ml-2 rounded-full bg-white px-2 text-sm" aria-label={`${count} items`}>{count}</span>}</Link>
        </nav>
      </div>
      {open && (
        <form onSubmit={search} role="search" className="mx-auto max-w-6xl px-4 pb-3">
          <input ref={input} type="search" name="q" placeholder="Search toys" aria-label="Search toys" className="w-full rounded-full border border-sky-border bg-page px-5 py-3" />
        </form>
      )}
    </header>
  );
}
