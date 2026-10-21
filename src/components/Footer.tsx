import { Link } from "react-router-dom";
const col = "space-y-2"; const h = "mb-3 font-extrabold text-ink"; const a = "block hover:text-ink hover:underline";
export default function Footer({ logoUrl = "/img/logo.png", hidden = [] }: { logoUrl?: string; hidden?: string[] }) {
  return (<footer className="mt-16 border-t border-sky-border bg-white text-sm text-mute">
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-3 lg:col-span-2"><Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-ink"><img src={logoUrl} alt="" width={44} height={26} className="h-9 w-auto rounded-lg object-cover" />Cloudy-Toy</Link>
        <p className="max-w-sm">Little Toys, Big Happiness. Thoughtfully chosen toys, delivered across Cambodia.</p></div>
      <nav aria-label="Shop" className={col}><p className={h}>Shop</p><Link to="/shop" className={a}>All toys</Link><Link to="/cart" className={a}>Cart</Link><Link to="/account" className={a}>My account</Link></nav>
      <nav aria-label="Company" className={col}><p className={h}>Company</p><Link to="/about" className={a}>About</Link>{!hidden.includes("contact") && <Link to="/contact" className={a}>Contact</Link>}</nav></div>
    <div className="border-t border-sky-border"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs"><span>© {new Date().getFullYear()} Cloudy-Toy. All rights reserved.</span><Link to="/admin/login" className="hover:underline">Admin login</Link></div></div>
  </footer>);
}
