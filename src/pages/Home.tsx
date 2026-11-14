import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import BannerSlider from "@/components/BannerSlider";
import Skeleton from "@/components/Skeleton";
import { useListedProducts, useSettings, usePromotions } from "@/lib/store";
import OfferCard, { buildOffers } from "@/components/OfferCard";
import { categoriesOf } from "@shared/products";
import { useTitle } from "@/lib/title";
import { useI18n } from "@/lib/i18n";
/** Light-blue dripping edge along the top of the hero. */
const DRIPS: [number, number][] = [[40, 40], [110, 58], [190, 34], [280, 52], [360, 38], [450, 62], [540, 36], [620, 50], [700, 32], [790, 56], [880, 40], [960, 60], [1040, 36], [1120, 50]];
const DRIP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="70" viewBox="0 0 1200 70" fill="#CFE8FA"><rect width="1200" height="22"/>${DRIPS.map(([x, h]) => `<rect x="${x - 13}" width="26" height="${h}" rx="13"/>`).join("")}</svg>`;
const Drips = () => <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[70px]" style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(DRIP_SVG)}")`, backgroundRepeat: "repeat-x", backgroundSize: "auto 70px" }} />;
/** Row of small pastel tiles along the bottom of the hero (repeats sideways). */
const TILES = [["#CFE8FA", "M14 21C6 15 8 9 12 10c1 .3 2 1.5 2 1.5S15 10.300 16 10c4-1 6 5-2 11z"], ["#FFF0BF", "M14 7l2 4.600 5 .5-3.800 3.300 1.200 5L14 17.800 9.600 20.400l1.200-5L7 12.100l5-.5z"], ["#FFD9E6", "M9 19a4 4 0 0 1 .5-8A5 5 0 0 1 19 12a3.500 3.500 0 0 1 0 7z"], ["#E4D9FB", "M14 8a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"]];
const STRIP = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILES.length * 2 * 34}" height="32" viewBox="0 0 ${TILES.length * 2 * 34} 32">${[...TILES, ...TILES].map(([c, d], i) => `<g transform="translate(${i * 34 + 2} 2)"><rect width="28" height="28" rx="7" fill="${c}"/><path d="${d}" fill="#fff" fill-opacity=".9"/></g>`).join("")}</svg>`;
/** Pastel circle colours and an emoji icon picked from the category name (admins can name categories anything, so unknown names get a cloud). */
const RING = ["#FFE9F1", "#E6F1FF", "#FFF3CF", "#EFE6FF", "#DDF6E8", "#FFE8D6"];
const ICONS: [RegExp, string][] = [[/doll|figure|lads/i, "🪆"], [/plush|plusie|teddy|bear/i, "🧸"], [/acrylic|card/i, "🃏"], [/accessor|outfit|key|charm|jewel/i, "🎀"], [/mystery|blind|box|surprise/i, "🎁"], [/sticker/i, "💟"], [/promo|sale|offer|deal/i, "🏷️"], [/official|authentic/i, "✅"], [/pre-?order/i, "⏳"], [/baby|rattle/i, "🍼"], [/puzzle/i, "🧩"], [/block|build/i, "🧱"], [/train|car|vehicle/i, "🚂"]];
const catIcon = (c: string) => ICONS.find(([r]) => r.test(c))?.[1] ?? "☁️";
export default function Home() {
  useTitle(); const { t, lang } = useI18n();
  const { data: products } = useListedProducts(); const { settings: { banners, categoryImages } } = useSettings(); const icons = categoryImages ?? {}; const { promotions } = usePromotions();
  const offers = buildOffers(promotions, products ?? [], lang, t); const cats = categoriesOf(products ?? []).slice(0, 6); const featured = (products ?? []).slice(0, 8);
  const banner = Array.isArray(banners) ? banners : [];
  // The big banner under the header is the picture(s) the admin uploads in Settings (it fades from one to the next). The full-width text hero only shows while no banner has been uploaded; both carry the \"Shopping with Cloudy Toys now!\" button.
  return (<>
    {banner.length > 0 ? <BannerSlider images={banner} first /> : <section className="relative left-1/2 -mt-5 mb-8 w-screen -translate-x-1/2 overflow-hidden bg-[#FFF8E6] px-5 pb-20 pt-16 sm:-mt-8 sm:px-10 lg:pb-24 lg:pt-20">
      <Drips />
      <div className="relative mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="text-center lg:text-left">
          <h1><span className="block font-['Caveat'] text-5xl font-bold leading-none text-[#1F4E9C] sm:text-7xl">Cloudy Toys</span><span className="mt-3 block text-2xl font-extrabold text-[#1F4E9C] sm:text-4xl">♡ {t("Collect a little happiness")} ♡</span></h1>
          <p className="mx-auto mt-4 max-w-md text-mute lg:mx-0">{t("Handpicked toys from our heart, bringing a little smile to your world.")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start"><Link to="/shop" className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#5BAAF0] px-7 py-3 font-extrabold text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-[#4A99E0]"><span aria-hidden="true">♥</span>{t("Shopping with Cloudy Toys now!")}</Link></div></div>
        <div className="relative mx-auto w-full max-w-sm lg:max-w-none"><img src="/img/sidebar-mascot.png" alt="" width={812} height={522} className="h-auto w-full" />
          <span aria-hidden="true" className="absolute right-2 top-0 text-3xl text-[#99C3E4]">♡</span><span aria-hidden="true" className="absolute left-0 top-6 text-2xl text-[#FFB8D1]">✦</span></div></div>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-8" style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(STRIP)}")`, backgroundRepeat: "repeat-x", backgroundSize: "auto 32px" }} />
    </section>}
    {offers.length > 0 && <section className="mt-8"><div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><h2 className="flex items-center gap-2 text-2xl font-extrabold text-[#1F4E9C]"><span aria-hidden="true" className="text-[#5BAAF0]">✦</span>{t("Special Offer")}</h2><p className="text-sm text-mute">{t("Unlock discounts and freebies automatically at checkout")}</p></div>
      <Link to="/shop?sale=1" className="inline-flex items-center gap-1.5 rounded-full bg-[#DDF6E8] px-3.5 py-1.5 text-xs font-extrabold text-[#2F8F5B]"><span aria-hidden="true">🎁</span>{offers.length} {t("Live Offers")}</Link></div>
      <div className="grid gap-4 lg:grid-cols-2">{offers.slice(0, 2).map((o) => <OfferCard key={o.id} o={o} t={t} />)}</div></section>}
    <nav aria-label={t("Category")} className="mt-8 grid grid-flow-col auto-cols-[5.5rem] gap-3 overflow-x-auto pb-2 sm:auto-cols-fr sm:overflow-visible">
      {[{ label: t("All Products"), to: "/shop", icon: "☁️", img: icons.__all }, ...cats.map((c) => ({ label: c, to: `/shop?category=${encodeURIComponent(c)}`, icon: catIcon(c), img: icons[c] })), { label: t("New Arrival"), to: "/shop?type=new_arrival", icon: "⭐", img: icons.__new }].map((c, i) => (
        <Link key={c.to} to={c.to} className="group flex flex-col items-center gap-2 text-center"><span className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border-2 border-white text-3xl shadow-soft transition group-hover:-translate-y-1 sm:h-20 sm:w-20" style={{ backgroundColor: RING[i % RING.length] }}>{c.img ? <img src={c.img} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span aria-hidden="true">{c.icon}</span>}</span><span className="text-xs font-bold text-[#1F4E9C] sm:text-sm">{c.label}</span></Link>))}</nav>
    <section className="mt-8"><div className="mb-3 flex items-end justify-between gap-3"><h2 className="flex items-center gap-2 text-xl font-extrabold text-[#1F4E9C] sm:text-2xl"><span aria-hidden="true">☁️</span>{t("Featured Cloudy Products")}</h2><Link to="/shop" className="text-sm font-bold text-[#4A86D8] hover:underline">{t("View All")} →</Link></div>
      {!products ? <Skeleton /> : featured.length === 0 ? <p className="rounded-xl2 bg-sky-pale p-8 text-center text-mute">{t("New arrivals are coming soon.")}</p>
        : <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div>}</section>
    {[{ id: "new_arrival", title: lang === "km" ? "មកថ្មី" : t("New Arrival"), empty: false }, { id: "best_seller", title: lang === "km" ? "លក់ដាច់បំផុត" : t("Best Sellers"), empty: true }].map((sec) => (
      <section key={sec.id} className="mt-12"><div className="mb-4 flex items-end justify-between gap-3"><h2 className="text-2xl font-extrabold">{sec.title}</h2><Link to={`/shop?type=${sec.id}`} className="font-semibold underline">{t("See all")}</Link></div>
        {!products ? <Skeleton /> : (() => { const list = products.filter((p) => p.labels?.includes(sec.id as "best_seller")); return list.length === 0
          ? <p className="rounded-xl2 bg-sky-pale p-8 text-center text-mute">{sec.empty ? t("Our best sellers are coming soon.") : t("New arrivals are coming soon.")} <Link to="/shop" className="font-semibold underline">{t("Browse all products")}</Link></p>
          : <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{list.slice(0, 12).map((p) => <ProductCard key={p.id} p={p} />)}</div>; })()}</section>))}
    <section aria-label="Shop promises" className="mt-12 grid grid-cols-2 gap-4 rounded-3xl border border-sky-border bg-white/80 p-4 text-sm shadow-soft lg:grid-cols-3">
      {[["🛡️", t("100% Authentic"), t("Official Products")], ["💳", t("Secure Payment"), t("Multiple Methods")], ["💬", t("Friendly Support"), t("We're here to help!")]].map(([i, a, b]) => <div key={a} className="flex items-center justify-center gap-3"><span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-pale text-lg">{i}</span><div><p className="font-extrabold text-[#1F4E9C]">{a}</p><p className="text-xs text-mute">{b}</p></div></div>)}</section>
  </>);
}
