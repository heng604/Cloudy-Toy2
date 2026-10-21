import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import BannerSlider from "@/components/BannerSlider";
import Skeleton from "@/components/Skeleton";
import { useProducts, useSettings } from "@/lib/store";
import { useTitle } from "@/lib/title";
export default function Home() {
  useTitle();
  const { data: products } = useProducts(); const { settings: { banners } } = useSettings();
  return (<>
    <section className="rounded-xl2 bg-sky-pale p-10 text-center shadow-soft">
      <h1 className="text-4xl font-extrabold sm:text-6xl">Little Toys, Big Happiness.</h1>
      <p className="mx-auto mt-4 max-w-xl text-mute">Thoughtfully chosen toys for every age, delivered across Cambodia.</p>
      <div className="mt-6 flex justify-center gap-3"><Link to="/shop" className="rounded-full bg-sky px-6 py-3 font-bold hover:bg-sky-hover">Shop Now</Link><Link to="/shop" className="rounded-full border border-sky-border bg-white px-6 py-3 font-bold">Explore Toys</Link></div>
    </section>
    <BannerSlider images={Array.isArray(banners) ? banners : []} />
    <section className="mt-12"><h2 className="mb-4 text-2xl font-extrabold">Featured toys</h2>
      {!products ? <Skeleton /> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}</div>}</section>
  </>);
}
