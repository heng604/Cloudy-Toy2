import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import OfferProductCard from "@/components/OfferProductCard";
import { buildOffers, TONES, type Offer } from "@/components/OfferCard";
import { CloudBadge, Countdown, HAND, Mascot, SkyBackdrop, endOf } from "@/components/OfferDeco";
import Skeleton from "@/components/Skeleton";
import { useListedProducts, usePromotions, useSettings } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useTitle } from "@/lib/title";
import { money, type Product } from "@shared/products";
import type { Promotions } from "@shared/promotions";
const usd = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
/** What the cloud badge says for this offer. */
function badgeOf(o: Offer, t: (s: string) => string): { top?: string; big: string; bottom?: string } | null {
  const c = o.rule, f = o.festival; if (f) return f.percent > 0 ? { top: t("UP TO"), big: `${f.percent}%`, bottom: t("OFF") } : null; if (!c) return null;
  switch (c.kind) {
    case "spend_percent": case "category_percent": case "product_percent": return { top: t("UP TO"), big: `${c.percent}%`, bottom: t("OFF") };
    case "category_amount": case "product_amount": return { top: t("SAVE"), big: usd(c.amountCents), bottom: t("PER ITEM") };
    case "spend_amount": return { top: t("SAVE"), big: usd(c.amountCents), bottom: t("ON YOUR ORDER") };
    case "bogo": return { top: `${t("BUY")} ${c.buyQty ?? 1}`, big: `${t("GET")} ${c.getQty ?? 1}`, bottom: t("FREE") };
    case "spend_gift": return { top: `${t("SPEND")} ${usd(c.minSpendCents)}`, big: t("FREE"), bottom: t("GIFT") };
    case "free_shipping": return { top: t("DELIVERY"), big: t("FREE") };
  }
}
/** The products an offer is about, who it applies to, and the free gift (if any). */
function offerScope(o: Offer, all: Product[], t: (s: string) => string) {
  const c = o.rule, f = o.festival; const byId = (ids: string[]) => all.filter((p) => ids.includes(p.id));
  if (f) return { products: byId(f.productIds), scope: t("Selected products"), gift: undefined as Product | undefined };
  if (!c) return { products: all.slice(0, 8), scope: t("Whole order"), gift: undefined };
  const gift = c.bonusProductId ? all.find((p) => p.id === c.bonusProductId) : undefined;
  if (c.kind === "category_percent" || c.kind === "category_amount") return { products: all.filter((p) => same(p.category, c.category)), scope: c.category, gift };
  if (c.kind === "product_percent" || c.kind === "product_amount") return { products: byId(c.productIds ?? []), scope: t("Selected products"), gift };
  if (c.kind === "bogo") { const buy = c.buyType === "product" ? all.filter((p) => p.id === c.buyTarget) : all.filter((p) => same(p.category, c.buyTarget ?? "")); return { products: buy, scope: c.buyType === "product" ? buy[0]?.name ?? t("Selected products") : c.buyTarget ?? "", gift }; }
  return { products: all.slice(0, 8), scope: t("Whole order"), gift };
}
function terms(o: Offer, t: (s: string) => string, promotions: Promotions): string[] {
  const c = o.rule, f = o.festival; const out = [`${t("Offer period")}: ${o.validity}`];
  if (f) out.push(f.code ? `${t("Use the event code at checkout")}: ${f.code}` : t("The discount is applied automatically to the selected products."));
  if (c) {
    out.push(t("Applied automatically at checkout. No code needed."));
    if (c.kind === "free_shipping") { if ((c.minQty ?? 0) > 0) out.push(`${t("Minimum items")}: ${c.minQty}`); else if (c.minSpendCents > 0) out.push(`${t("Minimum spend")}: ${usd(c.minSpendCents)}`); if (c.area === "PHNOM_PENH") out.push(t("Phnom Penh deliveries only.")); }
    else if (c.kind.startsWith("spend") && c.minSpendCents > 0) out.push(`${t("Minimum spend")}: ${usd(c.minSpendCents)}`);
    if (c.kind === "bogo" || c.kind === "spend_gift") out.push(t("The free gift is added to your order automatically."));
  }
  void promotions; return out;
}
/** Page opened by "View Details" on an offer card: sky banner with the countdown, then the product-page style details, then the products in the offer. */
export default function OfferDetail() {
  const { id } = useParams(); const { t, lang } = useI18n(); const { data: all } = useListedProducts(); const { promotions } = usePromotions(); const { settings } = useSettings(); const [saved, setSaved] = useState(false);
  const offer = all ? buildOffers(promotions, all, lang, t).find((o) => o.id === id) : undefined;
  useTitle(all ? offer?.title ?? t("Special Offer") : undefined);
  if (!all) return <Skeleton />;
  if (!offer) return (<div className="mx-auto max-w-lg space-y-4 rounded-3xl bg-white p-8 text-center shadow-soft"><p className="text-5xl" aria-hidden="true">🎈</p><h1 className="text-2xl font-extrabold text-[#1F4E9C]">{t("This offer has ended or is not available.")}</h1><Link to="/shop?sale=1" className="inline-block rounded-full bg-[#7A3FD8] px-6 py-2.5 font-extrabold text-white hover:bg-[#6930C4]">{t("See all special offers")}</Link></div>);
  const tone = TONES[offer.tone], badge = badgeOf(offer, t), { products, scope, gift } = offerScope(offer, all, t); const e = endOf(offer.rule?.endDate ?? offer.festival?.endDate); const end = e > Date.now() ? e : 0; const code = offer.festival?.code;
  const go = () => document.getElementById("offer-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const useCode = () => { try { sessionStorage.setItem("ct-event-code", code ?? ""); } catch { /* private mode */ } setSaved(true); };
  return (<div className="relative left-1/2 -mt-5 w-screen -translate-x-1/2 space-y-8 sm:-mt-8">
    <section className="relative overflow-hidden px-4 py-6 sm:px-10 sm:py-8 lg:px-16">{settings.offerDetailImage ? <img src={settings.offerDetailImage} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" /> : <SkyBackdrop />}
      <div className="relative mx-auto grid max-w-[1700px] items-center gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="text-center lg:text-left">
          <nav aria-label="Breadcrumb" className="mb-3 text-sm font-bold text-[#1F4E9C]"><Link to="/" className="hover:underline">{t("Home")}</Link> <span aria-hidden="true">/</span> <Link to="/shop?sale=1" className="hover:underline">{t("Special Offer")}</Link> <span aria-hidden="true">/</span> <span className="opacity-70">{offer.title}</span></nav>
          <span className={`inline-flex items-center rounded-full px-4 py-1 text-sm font-extrabold shadow-soft ${tone.badge}`}>{offer.badge}</span>
          <h1 className="mt-3 break-words font-['Nunito'] text-4xl font-black leading-tight tracking-tight text-[#1F4E9C] [-webkit-text-stroke:6px_#fff] [paint-order:stroke_fill] sm:text-6xl">{offer.title}</h1>
          <p className={`${HAND} mt-3 inline-block -rotate-2 bg-[#FFB6CD] px-8 py-1.5 text-xl font-bold text-[#1F4E9C] shadow-soft [clip-path:polygon(0_0,100%_0,95%_50%,100%_100%,0_100%,5%_50%)] sm:text-2xl`}>{t("Don't miss out on these amazing deals!")}</p></div>
        <div className="mx-auto w-full max-w-xs space-y-2 lg:ml-auto">{badge && <CloudBadge {...badge} />}{end > 0 && <Countdown end={end} t={t} />}</div></div></section>
    <div className="mx-auto max-w-[1700px] space-y-10 px-3 sm:px-6 lg:px-10">
      <section className="grid items-start gap-6 rounded-3xl border border-white bg-white/90 p-4 shadow-soft md:grid-cols-2 lg:gap-10 lg:p-8">
        <div className={`relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl border bg-gradient-to-br ${tone.bg}`}>
          {offer.image ? <img src={offer.image} alt={offer.title} decoding="async" className="h-full w-full object-cover" /> : <Mascot src={settings.offerMascotImage || undefined} className="h-3/4 w-auto object-contain" />}
          {badge && <span className={`absolute left-3 top-3 rounded-full px-4 py-1.5 text-sm font-extrabold shadow-soft ${tone.badge}`}>{[badge.top, badge.big, badge.bottom].filter(Boolean).join(" ")}</span>}</div>
        <div className="space-y-4 md:sticky md:top-24">
          <p className={`text-lg font-bold leading-snug ${tone.title}`}>{offer.text}</p>
          <p className={`inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-bold shadow-soft ${tone.date}`}>📅 {offer.validity}</p>
          <div className="flex flex-wrap gap-2 text-sm"><span className="rounded-full bg-sky-pale px-3 py-1 font-semibold">{t("Applies to")}: <b>{scope}</b></span>{products.length > 0 && <span className="rounded-full bg-sky-pale px-3 py-1 font-semibold">{products.length} {t("products")}</span>}</div>
          {gift && (offer.rule?.kind === "bogo" || offer.rule?.kind === "spend_gift") && <Link to={`/product/${gift.slug}`} className="flex items-center gap-3 rounded-2xl bg-[#FFE4EE] p-3 hover:shadow-soft"><img src={gift.images[0]?.src} alt="" className="h-16 w-16 rounded-xl object-cover" /><span className="text-sm"><b className="text-[#C2305F]">🎁 {t("Free gift")}</b><br />{(offer.rule.getQty ?? 1)} × {gift.name} <s className="ml-1 text-mute">{money(gift.price)}</s> <b>{money(0)}</b></span></Link>}
          <div className="space-y-2 rounded-2xl bg-[#F6FAFF] p-4 text-sm"><p className="font-extrabold text-[#1F4E9C]">{t("How it works")}</p><ul className="list-disc space-y-1 pl-5 text-ink/90">{terms(offer, t, promotions).map((x) => <li key={x}>{x}</li>)}</ul></div>
          {code && <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#EFE6FF] p-3 text-sm"><span className="font-bold">🎟️ {t("Quick event code")}:</span><span className="rounded-xl bg-white px-4 py-1.5 font-mono text-base font-extrabold text-[#4B2A99]">{code}</span><button type="button" onClick={useCode} className="rounded-full bg-[#7A3FD8] px-4 py-1.5 text-xs font-extrabold text-white hover:bg-[#6930C4]">{t("Apply to Bag")}</button>{saved && <span role="status" className="text-xs">{t("Saved! It is filled in at checkout.")} <Link to="/cart" className="font-bold underline">{t("Go to cart")}</Link></span>}</div>}
          <div className="flex flex-wrap gap-3 pt-1"><button type="button" onClick={go} className={`min-h-11 rounded-full px-7 font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${tone.btn}`}>{t("Shop offer products")} ↓</button><Link to="/shop?sale=1" className="inline-flex min-h-11 items-center rounded-full border border-sky-border bg-white px-6 font-bold hover:bg-sky-pale">{t("All special offers")}</Link></div></div></section>
      <section id="offer-products" className="scroll-mt-24"><div className="mb-4 flex items-end justify-between gap-3"><h2 className="text-2xl font-extrabold text-[#1F4E9C]">{t("Products in this offer")}</h2><Link to="/shop" className="text-sm font-bold text-[#4A86D8] hover:underline">{t("See all")} →</Link></div>
        {products.length === 0 ? <p className="rounded-xl2 bg-sky-pale p-8 text-center text-mute">{t("No products match.")}</p> : <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">{products.map((p) => <OfferProductCard key={p.id} p={p} />)}</div>}</section></div>
  </div>);
}
