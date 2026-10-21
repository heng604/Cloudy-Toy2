import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import Skeleton from "@/components/Skeleton";
import { useProducts } from "@/lib/store";
import { categoriesOf } from "@shared/products";
import { useTitle } from "@/lib/title";
import { useI18n } from "@/lib/i18n";
export default function Shop() {
  const { t } = useI18n(); useTitle(t("Shop"));
  const [sp] = useSearchParams(); const { data: all } = useProducts();
  if (!all) return <Skeleton />;
  const q = (sp.get("q") ?? "").toLowerCase(), category = sp.get("category"), sort = sp.get("sort");
  let list = all.filter((p) => p.name.toLowerCase().includes(q) && (!category || p.category === category));
  if (sort === "price-asc") list = [...list].sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
  if (sort === "price-desc") list = [...list].sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
  return (<div><h1 className="mb-4 text-2xl font-extrabold sm:text-3xl">{t("Shop")}</h1>
    <nav className="mb-6 flex flex-wrap gap-2 text-sm sm:text-base" aria-label="Categories"><Link to="/shop" className="rounded-full border border-sky-border bg-white px-4 py-2">{t("All")}</Link>{categoriesOf(all).map((c) => <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`} className="rounded-full border border-sky-border bg-white px-4 py-2">{c}</Link>)}
      <Link to="?sort=price-asc" className="ml-auto text-sm text-mute">{t("Price ↑")}</Link><Link to="?sort=price-desc" className="text-sm text-mute">{t("Price ↓")}</Link></nav>
    {list.length === 0 ? <p className="rounded-xl2 bg-sky-pale p-8 text-center">{t("No toys match.")} <Link to="/shop" className="underline">{t("Clear filters")}</Link></p>
      : <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>}</div>);
}
