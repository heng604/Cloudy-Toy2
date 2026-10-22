import { Link, useParams } from "react-router-dom";
import ProductGallery from "@/components/ProductGallery";
import ProductCard from "@/components/ProductCard";
import Skeleton from "@/components/Skeleton";
import NotFound from "@/components/NotFound";
import { money, isNewProduct, stockStatus } from "@shared/products";
import { useProducts } from "@/lib/store";
import { useTitle } from "@/lib/title";
import AddButton from "./AddButton";
export default function ProductPage() {
  const { slug } = useParams(); const { data: all } = useProducts();
  const p = all?.find((x) => x.slug === slug);
  useTitle(all ? p?.name ?? "Not found" : undefined);
  if (!all) return <Skeleton />;
  if (!p) return <NotFound />;
  const others = all.filter((x) => x.id !== p.id);
  const more = [...others.filter((x) => x.category === p.category), ...others.filter((x) => x.category !== p.category)].slice(0, 8);
  const st = stockStatus(p.stock);
  return (<div className="space-y-12">
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-mute"><Link to="/shop" className="hover:underline">Shop</Link>{p.category && <> <span aria-hidden="true">/</span> <Link to={`/shop?category=${encodeURIComponent(p.category)}`} className="hover:underline">{p.category}</Link></>}</nav>
      <div className="grid items-start gap-8 md:grid-cols-2 lg:gap-12">
        <ProductGallery key={p.id} images={p.images} name={p.name} />
        <div className="space-y-4 md:sticky md:top-24">
          <div className="flex flex-wrap gap-2">{isNewProduct(p.createdAt) && <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-extrabold uppercase tracking-wide text-white">New</span>}{p.category && <span className="rounded-full bg-sky-pale px-3 py-1 text-sm font-semibold">{p.category}</span>}</div>
          <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">{p.name}</h1>
          <p className="text-2xl font-extrabold sm:text-3xl">{money(p.price)}</p>
          <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${st === "OUT" ? "bg-red-100 text-red-800" : st === "LOW" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}><span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />{st === "OUT" ? "Out of stock" : st === "LOW" ? `Only ${p.stock} left` : `${p.stock} in stock`}</p>
          {p.description && <p className="whitespace-pre-line leading-relaxed text-ink/90">{p.description}</p>}
          <AddButton key={p.id} id={p.id} disabled={p.stock <= 0} />
          <p className="text-sm text-mute">SKU {p.sku} · Delivery across Cambodia</p>
        </div></div></div>
    {more.length > 0 && <section aria-labelledby="more-h"><div className="mb-4 flex items-end justify-between gap-3"><h2 id="more-h" className="text-2xl font-extrabold">More toys you may like</h2><Link to="/shop" className="font-semibold underline">See all</Link></div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{more.map((x) => <ProductCard key={x.id} p={x} />)}</div></section>}
  </div>);
}
