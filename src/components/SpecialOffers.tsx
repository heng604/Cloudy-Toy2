import { useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { usePromotions } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { dayShort, type Product } from "@shared/products";
import { campaignDetail, campaignLabel, inSpecialOffer, liveCampaigns, liveFestivals, festivalName, festivalText, festivalDetail, type Campaign, type Festival } from "@shared/promotions";
const BADGE: Record<Campaign["kind"], string> = { spend_amount: "bg-[#E7E5FF] text-[#4B3FC8]", spend_percent: "bg-[#E7E5FF] text-[#4B3FC8]", category_percent: "bg-[#F0E6FF] text-[#7A33C8]", product_percent: "bg-[#F0E6FF] text-[#7A33C8]", bogo: "bg-[#FFE4EA] text-[#D32F5B]", free_shipping: "bg-[#DDF6E8] text-[#2F8F5B]" };
const valid = (a?: string, b?: string) => (a && b ? `${dayShort(a)} – ${dayShort(b)}` : "Always active");
/** The page behind the "Special Offer" button: the live festival / event hero (with its quick code), every live promotion rule as a card, and the products that are part of an offer. */
export default function SpecialOffers({ all, festivalId }: { all: Product[]; festivalId?: string | null }) {
  const { t, lang } = useI18n(); const { promotions } = usePromotions(); const [open, setOpen] = useState<string | null>(null); const [saved, setSaved] = useState("");
  const fests = liveFestivals(promotions.festivals); const hero = fests.find((f) => f.id === festivalId) ?? fests[0]; const others = fests.filter((f) => f !== hero);
  const rules = liveCampaigns(promotions.campaigns); const nameOf = (id: string) => all.find((p) => p.id === id)?.name ?? "the free gift";
  const list = all.filter((p) => (festivalId && hero ? hero.productIds.includes(p.id) : inSpecialOffer(p, promotions.campaigns, promotions.festivals)));
  const useCode = (code: string) => { try { sessionStorage.setItem("ct-event-code", code); } catch { /* private mode: the code is shown anyway */ } setSaved(code); };
  const total = rules.length + fests.length;
  const Card = ({ id, badge, cls, validity, title, text, more }: { id: string; badge: string; cls: string; validity: string; title: string; text: string; more?: string }) => (
    <article className="flex flex-col rounded-2xl bg-white p-4 shadow-soft"><div className="flex items-center justify-between gap-2 text-xs"><span className={`rounded-full px-2.5 py-1 font-extrabold ${cls}`}>{badge}</span><span className="text-right text-mute">{t("Valid")}: {validity}</span></div>
      <h3 className="mt-3 font-extrabold">{title}</h3><p className="mt-1 flex-1 text-sm text-mute">{text}</p>
      {open === id && more && <p className="mt-2 whitespace-pre-line rounded-xl bg-sky-pale p-3 text-xs">{more}</p>}
      <button type="button" aria-expanded={open === id} onClick={() => setOpen(open === id ? null : id)} className="mt-3 rounded-xl bg-[#F3F6FB] py-2 text-xs font-extrabold hover:bg-sky-pale">{t("View Details")}</button></article>);
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {others.map((f: Festival) => <Card key={f.id} id={`f-${f.id}`} badge={t("Festival")} cls="bg-[#FFE9C7] text-[#B26B00]" validity={valid(f.startDate, f.endDate)} title={festivalName(f, lang)} text={festivalText(f, lang) || festivalDetail(f)} more={`${festivalDetail(f)}${f.code ? `\n${t("Code")}: ${f.code}` : ""}`} />)}
        {rules.map((c) => <Card key={c.id} id={c.id} badge={t(campaignLabel(c))} cls={BADGE[c.kind]} validity={valid(c.startDate, c.endDate)} title={c.name} text={campaignDetail(c, nameOf)} more={`${campaignDetail(c, nameOf)}.\n${t("Applied automatically at checkout.")}`} />)}</div></section>
      : <p className="rounded-xl2 bg-sky-pale p-6 text-center text-mute">{t("No special offers right now. Please check back soon!")}</p>}
    <section><h2 className="text-xl font-extrabold">{t("Featured Cloudy Products")}</h2><p className="mb-3 text-sm text-mute">{t("Products that are part of a special offer")}</p>
      {list.length === 0 ? <p className="rounded-xl2 bg-sky-pale p-8 text-center">{t("No products match.")} <Link to="/shop" className="underline">{t("Browse all products")}</Link></p>
        : <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>}</section>
  </div>);
}
