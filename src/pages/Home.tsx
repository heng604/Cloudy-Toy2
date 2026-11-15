import { useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import BannerSlider from "@/components/BannerSlider";
import Skeleton from "@/components/Skeleton";
import SectionHead from "@/components/SectionHead";
import { useListedProducts, useSettings, usePromotions } from "@/lib/store";
import OfferCard, { buildOffers } from "@/components/OfferCard";
import { categoriesOf, type Product } from "@shared/products";
import { catIcon } from "@/lib/catIcon";
import { useTitle } from "@/lib/title";
import { useI18n } from "@/lib/i18n";
/** Pastel circle colours behind the category pictures. */
const RING = ["#FFE9F1", "#E6F1FF", "#FFF3CF", "#EFE6FF", "#DDF6E8", "#FFE8D6"];
const GRID = "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4";
const ViewAll = ({ to, label }: { to: string; label: string }) => <Link to={to} className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#CFE3F8] bg-white px-5 py-2 text-sm font-bold text-[#2F6FD0] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#EAF5FF] hover:shadow-soft">{label}<span aria-hidden="true">→</span></Link>;
/** "New Arrivals": title + subtitle, category chips (they filter the cards right here), View All button, then the cards. */
function NewArrivals({ products }: { products: Product[] | undefined }) {
  const { t, lang } = useI18n(); const [cat, setCat] = useState<string | null>(null);
  const all = (products ?? []).filter((p) => p.labels?.includes("new_arrival")); const cats = categoriesOf(all); const active = cat && cats.includes(cat) ? cat : null;
  const list = active ? all.filter((p) => p.category === active) : all;
  return (<section className="mt-10">
    <SectionHead title={lang === "km" ? "មកថ្មី" : t("New Arrivals")} sub={t("Be the first to get our newest arrivals!")} right={<ViewAll to="/shop?type=new_arrival" label={t("View All")} />} />
    {cats.length > 0 && <div role="group" aria-label={t("Category")} className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none]">
      <button type="button" aria-pressed={!active} onClick={() => setCat(null)} className={`chip ${!active ? "chip-on" : ""}`}><span aria-hidden="true">✦</span>{t("All")}</button>
      {cats.map((c) => <button key={c} type="button" aria-pressed={active === c} onClick={() => setCat(c)} className={`chip ${active === c ? "chip-on" : ""}`}><span aria-hidden="true">{catIcon(c)}</span>{c}</button>)}</div>}
    {!products ? <Skeleton /> : list.length === 0
      ? <p className="rounded-[1.6rem] bg-white/80 p-8 text-center text-mute shadow-soft">{t("New arrivals are coming soon.")} <Link to="/shop" className="font-semibold underline">{t("Browse all products")}</Link></p>
      : <div className={GRID}>{list.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}</div>}
  </section>);
}
export default function Home() {
  useTitle(); const { t, lang } = useI18n();
  const { data: products } = useListedProducts(); const { settings: { banners, categoryImages } } = useSettings(); const icons = categoryImages ?? {}; const { promotions } = usePromotions();
  const offers = buildOffers(promotions, products ?? [], lang, t); const cats = categoriesOf(products ?? []).slice(0, 6); const featured = (products ?? []).slice(0, 8);
  const banner = Array.isArray(banners) ? banners : [];
  // The big banner under the header is the picture(s) the admin uploads in Settings (it fades from one to the next). The full-width sky hero only shows while no banner has been uploaded; both carry the "Shopping with Cloudy Toys now!" button.
  return (<>
    {banner.length > 0 ? <BannerSlider images={banner} first /> : <section className="relative left-1/2 -mt-5 mb-8 w-screen -translate-x-1/2 overflow-hidden bg-gradient-to-b from-[#BFDFFF] via-[#DCEEFF] to-[#EEF7FF] px-5 pb-24 pt-14 sm:-mt-8 sm:px-10 lg:pb-28 lg:pt-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 22% 18% at 10% 92%,#fff,transparent 70%),radial-gradient(ellipse 26% 20% at 36% 100%,#fff,transparent 70%),radial-gradient(ellipse 24% 18% at 66% 96%,#fff,transparent 70%),radial-gradient(ellipse 22% 20% at 92% 100%,#fff,transparent 70%)" }} />
      <span aria-hidden="true" className="absolute left-[6%] top-10 text-3xl text-[#FFC93C]">✦</span><span aria-hidden="true" className="absolute right-[8%] top-8 text-2xl text-[#FF8FB1]">♥</span><span aria-hidden="true" className="absolute left-[46%] top-6 text-xl text-white">✦</span>
      <div className="relative mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="text-center lg:text-left">
          <h1><span className="block font-display text-5xl font-bold leading-none text-[#1F3F8F] sm:text-7xl">Cloudy Toys</span><span className="mt-3 block font-['Caveat'] text-3xl font-bold text-[#2F6FD0] sm:text-4xl">♡ {t("Collect a little happiness")} ♡</span></h1>
          <p className="mx-auto mt-4 max-w-md text-[#3F5E8C] lg:mx-0">{t("Handpicked toys from our heart, bringing a little smile to your world.")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start"><Link to="/shop" className="btn-blue inline-flex items-center gap-2 whitespace-nowrap rounded-full px-7 py-3 font-extrabold"><span aria-hidden="true">♥</span>{t("Shopping with Cloudy Toys now!")}</Link></div></div>
        <div className="relative mx-auto w-full max-w-sm lg:max-w-none"><img src="/img/sidebar-mascot.png" alt="" width={812} height={522} className="h-auto w-full" /></div></div>
    </section>}
    {offers.length > 0 && <section className="mt-8"><SectionHead title={t("Special Offer")} sub={t("Unlock discounts and freebies automatically at checkout")} right={<Link to="/shop?sale=1" className="inline-flex items-center gap-1.5 rounded-full bg-[#DDF6E8] px-3.5 py-1.5 text-xs font-extrabold text-[#2F8F5B]"><span aria-hidden="true">🎁</span>{offers.length} {t("Live Offers")}</Link>} />
      <div className="grid gap-4 lg:grid-cols-2">{offers.slice(0, 2).map((o) => <OfferCard key={o.id} o={o} t={t} />)}</div></section>}
    <nav aria-label={t("Category")} className="mt-8 grid grid-flow-col auto-cols-[5.5rem] gap-3 overflow-x-auto pb-2 sm:auto-cols-fr sm:overflow-visible">
      {[{ label: t("All Products"), to: "/shop", icon: "☁️", img: icons.__all }, ...cats.map((c) => ({ label: c, to: `/shop?category=${encodeURIComponent(c)}`, icon: catIcon(c), img: icons[c] })), { label: t("New Arrival"), to: "/shop?type=new_arrival", icon: "⭐", img: icons.__new }].map((c, i) => (
        <Link key={c.to} to={c.to} className="group flex flex-col items-center gap-2 text-center"><span className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border-[3px] border-white text-3xl shadow-soft transition group-hover:-translate-y-1 group-hover:shadow-lift sm:h-20 sm:w-20" style={{ backgroundColor: RING[i % RING.length] }}>{c.img ? <img src={c.img} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span aria-hidden="true">{c.icon}</span>}</span><span className="font-display text-xs font-semibold text-[#1F3F8F] sm:text-sm">{c.label}</span></Link>))}</nav>
    <NewArrivals products={products} />
    <section className="mt-12"><SectionHead title={t("Featured Cloudy Products")} right={<ViewAll to="/shop" label={t("View All")} />} />
      {!products ? <Skeleton /> : featured.length === 0 ? <p className="rounded-[1.6rem] bg-white/80 p-8 text-center text-mute shadow-soft">{t("New arrivals are coming soon.")}</p>
        : <div className={GRID}>{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div>}</section>
    <section className="mt-12"><SectionHead title={lang === "km" ? "លក់ដាច់បំផុត" : t("Best Sellers")} right={<ViewAll to="/shop?type=best_seller" label={t("See all")} />} />
      {!products ? <Skeleton /> : (() => { const list = products.filter((p) => p.labels?.includes("best_seller")); return list.length === 0
        ? <p className="rounded-[1.6rem] bg-white/80 p-8 text-center text-mute shadow-soft">{t("Our best sellers are coming soon.")} <Link to="/shop" className="font-semibold underline">{t("Browse all products")}</Link></p>
        : <div className={GRID}>{list.slice(0, 12).map((p) => <ProductCard key={p.id} p={p} />)}</div>; })()}</section>
  </>);
}
