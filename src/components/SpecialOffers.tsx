import { useState } from "react";
import { Link } from "react-router-dom";
import OfferCard, { buildOffers } from "@/components/OfferCard";
import { HAND, Mascot, SkyBackdrop, CloudBadge, Countdown, endOf } from "@/components/OfferDeco";
import OfferProductCard, { discountOf } from "@/components/OfferProductCard";
import { usePromotions, useSettings } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { categoriesOf, type Product } from "@shared/products";
import { inSpecialOffer, liveCampaigns, liveFestivals, festivalName, festivalText, productPromo, orderCampaigns } from "@shared/promotions";
/** The page behind the "Special Offer" button: sky banner with the biggest discount and a countdown, a category filter, the offer products and the promotion cards. */
export default function SpecialOffers({ all, festivalId }: { all: Product[]; festivalId?: string | null }) {
  const { t, lang } = useI18n(); const { promotions } = usePromotions(); const { settings } = useSettings(); const heroImg = settings.offerHeroImage || "", mascotImg = settings.offerMascotImage || "", footerImg = settings.offerFooterImage || "", showText = settings.offerHeroText !== false; const [saved, setSaved] = useState(""); const [cat, setCat] = useState("");
  const fests = liveFestivals(promotions.festivals); const hero = fests.find((f) => f.id === festivalId) ?? fests[0]; const rules = liveCampaigns(promotions.campaigns);
  const list = all.filter((p) => (festivalId && hero ? hero.productIds.includes(p.id) : inSpecialOffer(p, promotions.campaigns, promotions.festivals)));
  const cats = categoriesOf(list); const shown = cat && cats.includes(cat) ? list.filter((p) => p.category === cat) : list;
  const up = Math.max(0, ...list.map((p) => discountOf(p, productPromo(p, promotions.campaigns, promotions.festivals))), ...orderCampaigns(promotions.campaigns).map((c) => (c.kind === "spend_percent" ? c.percent : 0)));
  const ends = [...rules, ...fests].map((x) => endOf(x.endDate)).filter((e) => e > Date.now()); const end = ends.length ? Math.min(...ends) : 0;
  const offers = buildOffers(promotions, all, lang, t); const total = rules.length + fests.length;
  const useCode = (code: string) => { try { sessionStorage.setItem("ct-event-code", code); } catch { /* private mode: the code is shown anyway */ } setSaved(code); };
  const spark = (c: string, cls: string) => <span aria-hidden="true" className={`pointer-events-none absolute ${cls}`} style={{ color: c }}>✦</span>;
  // full screen: the page breaks out of the shop's centred column and runs edge to edge (banner touches the header and both sides)
  return (<div className="relative left-1/2 -mt-5 w-screen -translate-x-1/2 space-y-6 sm:-mt-8">
    <section className="relative overflow-hidden px-4 py-6 sm:px-10 sm:py-8 lg:px-16">
      {heroImg ? <img src={heroImg} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" /> : <SkyBackdrop />}
      <div className={`relative mx-auto grid max-w-[1700px] items-center gap-4 lg:grid-cols-[1.25fr_1fr_1fr] ${heroImg ? "min-h-[12rem] sm:min-h-[16rem]" : ""}`}>
        {showText ? <div className="text-center lg:text-left">
          {hero && <span className="mb-2 inline-block rounded-full bg-white/85 px-3 py-1 text-xs font-extrabold text-[#C2305F]">✨ {festivalName(hero, lang)}</span>}
          <h1 className="font-['Nunito'] text-5xl font-black leading-none tracking-tight text-[#1F4E9C] drop-shadow-[0_3px_0_rgba(255,255,255,.9)] [-webkit-text-stroke:7px_#fff] [paint-order:stroke_fill] sm:text-7xl">{t("Special Offer")}</h1>
          <p className={`${HAND} mt-4 inline-block -rotate-3 bg-[#FFB6CD] px-9 py-2 text-xl font-bold text-[#1F4E9C] shadow-soft [clip-path:polygon(0_0,100%_0,95%_50%,100%_100%,0_100%,5%_50%)] sm:text-2xl`}>{t("Don't miss out on these amazing deals!")}</p>
          <p className={`${HAND} mt-3 text-xl font-bold text-[#1F4E9C] sm:text-2xl`}>{hero && festivalText(hero, lang) ? festivalText(hero, lang) : `${t("Collect more happiness, for less!")} ♡`}</p></div>
          : <><h1 className="sr-only">{t("Special Offer")}</h1><div className="hidden lg:block" /></>}
        <div className="hidden justify-center lg:flex">{(!heroImg || mascotImg) && <Mascot src={mascotImg} className="h-52 w-auto max-w-full object-contain drop-shadow-xl" />}</div>
        <div className="mx-auto w-full max-w-xs space-y-2 lg:ml-auto">
          {up > 0 && <CloudBadge top={t("UP TO")} big={`${up}%`} bottom={t("OFF")} />}
          {end > 0 && <Countdown end={end} t={t} />}</div></div></section>
  <div className="space-y-6 px-3 sm:px-6 lg:px-10">
    {hero?.code && <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-white p-3 text-sm shadow-soft"><span className="font-bold">🎟️ {t("Quick event code")}:</span><span className="rounded-xl bg-[#EFE6FF] px-4 py-1.5 font-mono text-base font-extrabold text-[#4B2A99]">{hero.code}</span>
      <button type="button" onClick={() => useCode(hero.code!)} className="rounded-full bg-[#7A3FD8] px-4 py-1.5 text-xs font-extrabold text-white hover:bg-[#6930C4]">{t("Apply to Bag")}</button>
      {saved === hero.code && <span role="status" className="text-xs">{t("Saved! It is filled in at checkout.")} <Link to="/cart" className="font-bold underline">{t("Go to cart")}</Link></span>}</div>}
    {total > 0 && <section><div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-xl font-extrabold text-[#1F4E9C]">{t("Active Promotions & Rewards")}</h2><p className="text-sm text-mute">{t("Unlock discounts and freebies automatically at checkout")}</p></div><span className="shrink-0 rounded-full bg-[#DDF6E8] px-3 py-1 text-xs font-extrabold text-[#2F8F5B]">{total} {t("Live Offers")}</span></div>
      <div className="grid gap-4 lg:grid-cols-2">{offers.map((o) => <OfferCard key={o.id} o={o} t={t} />)}</div></section>}
    {total === 0 && list.length === 0 && <p className="rounded-xl2 bg-sky-pale p-6 text-center text-mute">{t("No special offers right now. Please check back soon!")}</p>}
    {list.length > 0 && <div className="grid items-start gap-5 lg:grid-cols-[14rem_1fr]">
      <aside className="rounded-3xl border border-white bg-white/90 p-4 shadow-soft lg:sticky lg:top-24 lg:p-5"><h2 className="flex items-center gap-2 text-lg font-extrabold text-[#1F4E9C]"><svg width="20" height="20" viewBox="0 0 24 24" fill="#4A86D8" aria-hidden="true"><path d="M20.600 13.400 13.400 20.600a2 2 0 0 1-2.800 0L2 12V2h10l8.600 8.600a2 2 0 0 1 0 2.800zM7 7.500a1.500 1.500 0 1 0 0-.01z" /></svg>{t("Filter by")}</h2>
        <hr className="my-3 border-sky-border" /><p className="mb-2 text-sm font-extrabold text-[#1F4E9C]">{t("Category")}</p>
        <div role="radiogroup" aria-label={t("Category")} className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
          {["", ...cats].map((c) => <label key={c || "all"} className={`flex shrink-0 cursor-pointer items-center gap-2.5 rounded-full px-2 py-1.5 text-sm font-semibold hover:bg-sky-pale lg:rounded-xl ${cat === c ? "text-[#1F4E9C]" : "text-ink"}`}><input type="radio" name="offer-cat" checked={cat === c} onChange={() => setCat(c)} className="h-4 w-4 accent-[#4A86D8]" />{c || t("All Products")}</label>)}</div></aside>
      <section aria-label={t("Featured Cloudy Products")}>{shown.length === 0 ? <p className="rounded-xl2 bg-sky-pale p-8 text-center">{t("No products match.")}</p>
        : <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">{shown.map((p) => <OfferProductCard key={p.id} p={p} />)}</div>}</section></div>}
    {list.length === 0 && total > 0 && <p className="rounded-xl2 bg-sky-pale p-6 text-center">{t("No products match.")} <Link to="/shop" className="underline">{t("Browse all products")}</Link></p>}
  </div>
  </div>);
}
