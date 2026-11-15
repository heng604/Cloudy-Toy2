import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Pagination from "@/components/Pagination";
import ProductCard from "@/components/ProductCard";
import Skeleton from "@/components/Skeleton";
import SectionHead from "@/components/SectionHead";
import CloudMascot from "@/components/CloudMascot";
import ScaledBanner from "@/components/ScaledBanner";
import { sizeOf } from "@/lib/imageSize";
import SpecialOffers from "@/components/SpecialOffers";
import { useListedProducts, usePromotions, useSettings } from "@/lib/store";
import { productPromo } from "@shared/promotions";
import { LABELS, categoriesOf } from "@shared/products";
import { catIcon } from "@/lib/catIcon";
import { useTitle } from "@/lib/title";
import { useI18n } from "@/lib/i18n";
/** "Our Products" banner, full width of the screen (edge to edge). Shows the picture the admin uploads in Admin > Settings > Products page banner; until one is uploaded it shows the default sky banner. */
function ProductsBanner({ type }: { type?: string }) {
  const { t, lang } = useI18n(); const { settings } = useSettings();
  // New Arrival and Pre-Order each have their own banner (Admin > Settings); everything else uses the main Products banner
  const own = type === "new_arrival" ? { img: settings.newArrivalBannerImage, size: "newarrival-banner", bg: "bg-[#FFE3EC]", tag: "Fresh toys just landed!" } : type === "preorder" ? { img: settings.preorderBannerImage, size: "preorder-banner", bg: "bg-[#FFF1C9]", tag: "Reserve yours before it sells out!" } : null;
  const img = (own ? own.img : settings.productsBannerImage) || "";
  const label = LABELS.find((l) => l.id === type); const heading = label ? (lang === "km" ? label.km : label.en) : t("Our Products");
  // edge to edge: break out of the page column and cancel the gap under the header (same as the Home banner)
  const wrap = "relative left-1/2 -mt-5 mb-7 w-screen -translate-x-1/2 overflow-hidden sm:-mt-8";
  if (img) return (<section aria-label={heading} className={wrap}><h1 className="sr-only">{heading}</h1><ScaledBanner src={img} k={sizeOf(settings, own ? own.size : "products-banner")} fetchPriority="high" /></section>);
  if (own) return (<section aria-label={heading} className={`${wrap} ${own.bg} py-8 sm:py-10 lg:py-12`}><div className="page-wrap"><h1 className="font-display text-3xl font-bold leading-none text-[#1F3F8F] sm:text-5xl lg:text-6xl">{heading}</h1><p className="mt-3 font-['Caveat'] text-xl font-semibold text-[#2F6FD0] sm:text-3xl">{t(own.tag)}</p></div></section>);
  return (<section aria-label={t("Our Products")} className={`${wrap} bg-gradient-to-b from-[#BFDFFF] via-[#D6EAFF] to-[#EAF5FF] py-8 sm:py-10 lg:py-12`}>
    <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 14% 22% at 6% 100%,#fff,transparent 72%),radial-gradient(ellipse 18% 24% at 34% 108%,#fff,transparent 72%),radial-gradient(ellipse 16% 22% at 66% 104%,#fff,transparent 72%),radial-gradient(ellipse 14% 20% at 96% 100%,#fff,transparent 72%)" }} />
    <div className="page-wrap relative">
      <span aria-hidden="true" className="absolute left-4 -top-4 text-xl text-[#FFC93C]">✦</span><span aria-hidden="true" className="absolute left-[44%] -top-3 text-2xl text-[#FFC93C]">★</span><span aria-hidden="true" className="absolute right-[34%] -top-2 text-xl text-[#FF8FB1]">♥</span><span aria-hidden="true" className="absolute bottom-0 left-[40%] text-lg text-white">✦</span>
      <div className="relative max-w-[62%] sm:max-w-[55%]">
        <h1 className="font-display text-3xl font-bold leading-none text-[#1F3F8F] sm:text-5xl lg:text-6xl">{t("Our Products")}</h1>
        <p className="mt-3 font-['Caveat'] text-xl font-semibold text-[#2F6FD0] sm:text-3xl">{t("Every little cloud, all in one place!")}</p>
        <span aria-hidden="true" className="mt-1 block h-1 w-40 rounded-full bg-[#FF8FB1]/80 sm:w-64" /></div>
      <div aria-hidden="true" className="absolute -bottom-4 right-3 flex items-end gap-3 sm:right-8"><span className="mb-16 hidden rounded-[1.6rem] border-2 border-white bg-white/90 px-4 py-2 font-['Caveat'] text-2xl font-bold text-[#2F6FD0] shadow-soft sm:block">{t("Shop the sky!")} ♡</span><CloudMascot className="h-24 w-28 sm:h-36 sm:w-44 lg:h-44 lg:w-52" /></div>
    </div>
  </section>);
}
const PER_PAGE = 16; // product cards on each page of the shop
export default function Shop() {
  const { t, lang } = useI18n(); useTitle(t("Product"));
  const [sp] = useSearchParams(); const { data: all } = useListedProducts(); const { promotions } = usePromotions();
  const pageParam = sp.get("page");
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [pageParam]); // new page = start at the top
  if (!all) return <Skeleton />;
  const q = (sp.get("q") ?? "").toLowerCase(), category = sp.get("category"), sort = sp.get("sort"), type = LABELS.find((l) => l.id === sp.get("type")), sale = sp.get("sale") === "1", fid = sp.get("festival");
  if (sale) return <SpecialOffers all={all} festivalId={fid} />; // the Special Offer button: event hero, promotion cards, offer products
  let list = all.filter((p) => p.name.toLowerCase().includes(q) && (!category || p.category === category) && (!type || !!p.labels?.includes(type.id)));
  const now = (p: (typeof list)[number]) => productPromo(p, promotions.campaigns, promotions.festivals).finalCents; // price after any category / festival discount
  if (sort === "price-asc") list = [...list].sort((a, b) => now(a) - now(b));
  if (sort === "price-desc") list = [...list].sort((a, b) => now(b) - now(a));
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE)); const page = Math.min(pages, Math.max(1, Math.floor(Number(pageParam)) || 1));
  const shown = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pageLink = (n: number) => { const q2 = new URLSearchParams(sp); if (n <= 1) q2.delete("page"); else q2.set("page", String(n)); const qs = q2.toString(); return qs ? `/shop?${qs}` : "/shop"; };
  const title = category ?? (type ? (lang === "km" ? type.km : type.en) : t("All Products"));
  const cats = categoriesOf(all); const small = "text-sm text-[#4A6FA5] hover:text-[#1F4E9C] hover:underline";
  return (<div>
    <ProductsBanner type={type?.id} />
    <SectionHead as="h2" title={title} sub={`${list.length} ${t("cute finds waiting for you")}`} right={
      <nav className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none]" aria-label="Categories">
        <Link to="/shop" aria-current={!category && !type ? "page" : undefined} className={`chip ${!category && !type ? "chip-on" : ""}`}><span aria-hidden="true">✦</span>{t("All")}</Link>
        {cats.map((c) => <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`} aria-current={category === c ? "page" : undefined} className={`chip ${category === c ? "chip-on" : ""}`}><span aria-hidden="true">{catIcon(c)}</span>{c}</Link>)}
      </nav>} />
    <nav className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2" aria-label={t("Product")}>
      {LABELS.map((l) => <Link key={l.id} to={`/shop?type=${l.id}`} aria-current={type?.id === l.id ? "page" : undefined} className={`rounded-full px-3 py-1 text-xs font-bold transition sm:text-sm ${type?.id === l.id ? "bg-[#1F4E9C] text-white" : "bg-white/80 text-[#1F4E9C] hover:bg-white"}`}>{lang === "km" ? l.km : l.en}</Link>)}
      <span className="ml-auto flex gap-3"><Link to="?sort=price-asc" className={small}>{t("Price ↑")}</Link><Link to="?sort=price-desc" className={small}>{t("Price ↓")}</Link></span></nav>
    {list.length === 0 ? <p className="rounded-[1.6rem] bg-white/80 p-8 text-center shadow-soft">{t("No products match.")} <Link to="/shop" className="underline">{t("Clear filters")}</Link></p>
      : <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{shown.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
    <Pagination page={page} pages={pages} to={pageLink} /></div>);
}
