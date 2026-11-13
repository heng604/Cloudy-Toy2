import { useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import OfferCard, { buildOffers } from "@/components/OfferCard";
import { usePromotions } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { dayShort, type Product } from "@shared/products";
import { inSpecialOffer, liveCampaigns, liveFestivals, festivalName, festivalText } from "@shared/promotions";
/** The page behind the "Special Offer" button: the live festival / event hero (with its quick code), every live promotion rule as a card, and the products that are part of an offer. */
export default function SpecialOffers({ all, festivalId }: { all: Product[]; festivalId?: string | null }) {
  const { t, lang } = useI18n(); const { promotions } = usePromotions(); const [open, setOpen] = useState<string | null>(null); const [saved, setSaved] = useState("");
  const fests = liveFestivals(promotions.festivals); const hero = fests.find((f) => f.id === festivalId) ?? fests[0]; const others = fests.filter((f) => f !== hero);
    const list = all.filter((p) => (festivalId && hero ? hero.productIds.includes(p.id) : inSpecialOffer(p, promotions.campaigns, promotions.festivals)));
  const useCode = (code: string) => { try { sessionStorage.setItem("ct-event-code", code); } catch { /* private mode: the code is shown anyway */ } setSaved(code); };
  const total = liveCampaigns(promotions.campaigns).length + fests.length;
  const offers = buildOffers(promotions, all, lang, t).filter((o) => !hero || o.id !== `f-${hero.id}`);
  return (<div className="space-y-8">
    {hero ? <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#4F6BFF] via-[#2EB6FF] to-[#7B2FFF] p-6 text-white shadow-lift sm:p-8">
      <div className="grid items-center gap-5 md:grid-cols-[1fr_auto]"><div><span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold">✨ {t("Active Store Event")}</span>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">{festivalName(hero, lang)}</h1>
        {festivalText(hero, lang) && <p className="mt-2 max-w-xl whitespace-pre-line text-sm text-white/90 sm:text-base">{festivalText(hero, lang)}</p>}
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">{hero.endDate && <span className="rounded-full bg-white/20 px-3 py-1">⏳ {t("Ends")}: {dayShort(hero.endDate)}</span>}{hero.percent > 0 && <span className="rounded-full bg-white/20 px-3 py-1">🏷️ -{hero.percent}%</span>}{hero.code && <span className="rounded-full bg-white/20 px-3 py-1">🎟️ {t("Code")}: {hero.code}</span>}</div></div>
        {hero.code && <div className="rounded-2xl bg-white/15 p-4 text-center backdrop-blur"><p className="text-[11px] font-extrabold uppercase tracking-widest">{t("Quick event code")}</p><p className="mt-2 rounded-xl bg-white px-6 py-2 font-mono text-lg font-extrabold text-[#4B3FC8]">{hero.code}</p>
          <button type="button" onClick={() => useCode(hero.code!)} className="mt-2 w-full rounded-lg bg-[#3B1FD0] px-4 py-1.5 text-xs font-extrabold hover:bg-[#2F18B0]">{t("Apply to Bag")}</button>
          {saved === hero.code && <p role="status" className="mt-2 text-xs">{t("Saved! It is filled in at checkout.")} <Link to="/cart" className="font-bold underline">{t("Go to cart")}</Link></p>}</div>}</div></section>
      : <h1 className="text-2xl font-extrabold sm:text-3xl">{t("Special Offer")}</h1>}
    {total > 0 ? <section><div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-xl font-extrabold">{t("Active Promotions & Rewards")}</h2><p className="text-sm text-mute">{t("Unlock discounts and freebies automatically at checkout")}</p></div><span className="shrink-0 rounded-full bg-[#DDF6E8] px-3 py-1 text-xs font-extrabold text-[#2F8F5B]">{total} {t("Live Offers")}</span></div>
      <div className="grid gap-4 lg:grid-cols-2">{offers.map((o) => <OfferCard key={o.id} o={o} t={t} onClick={() => setOpen(open === o.id ? null : o.id)} open={open === o.id} />)}</div></section>
      : <p className="rounded-xl2 bg-sky-pale p-6 text-center text-mute">{t("No special offers right now. Please check back soon!")}</p>}
    <section><h2 className="text-xl font-extrabold">{t("Featured Cloudy Products")}</h2><p className="mb-3 text-sm text-mute">{t("Products that are part of a special offer")}</p>
      {list.length === 0 ? <p className="rounded-xl2 bg-sky-pale p-8 text-center">{t("No products match.")} <Link to="/shop" className="underline">{t("Browse all products")}</Link></p>
        : <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>}</section>
  </div>);
}
