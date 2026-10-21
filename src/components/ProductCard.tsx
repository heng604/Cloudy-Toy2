import { Link } from "react-router-dom";
import { type Product, FALLBACK_IMG, money, isNewProduct } from "@shared/products";
import { useCart } from "./CartProvider";
export default function ProductCard({p}:{p:Product}) {
  const { add } = useCart();
  const img = p.images[0];
  const out = p.stock<=0;
  return (
    <article className="group transition-transform duration-200 hover:-translate-y-1.5 overflow-hidden rounded-xl2 border border-sky-border bg-white shadow-soft hover:shadow-lift">
      <Link to={`/product/${p.slug}`} className="relative block overflow-hidden bg-sky-pale">
        {isNewProduct(p.createdAt) && !out && <span className="absolute left-3 top-3 z-10 rounded-full bg-ink px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-soft">New</span>}
        <img src={img?.src??FALLBACK_IMG} alt={img?.alt??p.name} loading="lazy" decoding="async" width={400} height={300} className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"/>
      </Link>
      <div className="space-y-2 p-4">
        <Link to={`/product/${p.slug}`} className="font-bold hover:underline">{p.name}</Link>
        <p className="text-mute text-sm">{p.category}</p>
        <p className="font-extrabold">{p.salePrice?<><span>{money(p.salePrice)}</span> <s className="text-mute font-normal">{money(p.price)}</s></>:money(p.price)}</p>
        <button type="button" disabled={out} onClick={()=>add(p.id)} className="min-h-11 w-full rounded-full bg-sky font-bold hover:bg-sky-hover disabled:cursor-not-allowed disabled:opacity-50">{out?"Out of stock":"Add to cart"}</button>
      </div>
    </article>
  );
}
