import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import BannerSlider from "@/components/BannerSlider";
import Skeleton from "@/components/Skeleton";
import { useListedProducts, useSettings } from "@/lib/store";
import { useTitle } from "@/lib/title";
import { useI18n } from "@/lib/i18n";
export default function Home() {
  useTitle(); const { t } = useI18n();
  const { data: products } = useListedProducts(); const { settings: { banners } } = useSettings();
  return (<>
    <section className="rounded-xl2 bg-sky-pale px-5 py-8 text-center shadow-soft sm:p-10 lg:py-14">
      <h1 className="text-3xl font-extrabold sm:text-5xl lg:text-6xl">{t("Collect a little happiness")}</h1>
      <p className="mx-auto mt-4 max-w-xl text-mute">{t("Handpicked toys from our heart, bringing a little smile to your world.")}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3"><Link to="/shop" className="rounded-full bg-sky px-6 py-3 font-bold hover:bg-sky-hover">{t("Shop Now")}</Link><Link to="/shop" className="rounded-full border border-sky-border bg-white px-6 py-3 font-bold">{t("Explore product")}</Link></div>
    </section>
    <BannerSlider images={Array.isArray(banners) ? banners : []} />
    <section className="mt-12"><h2 className="mb-4 text-2xl font-extrabold">{t("Featured products")}</h2>
      {!products ? <Skeleton /> : <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{products.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}</div>}</section>
  </>);
}
