import { useEffect, useRef, useState } from "react";
import ScaledBanner from "@/components/ScaledBanner";
import { sizeOf } from "@/lib/imageSize";
import { Link, useParams } from "react-router-dom";
import OfferProductCard from "@/components/OfferProductCard";
import { buildOffers, TONES, type Offer, type Tone } from "@/components/OfferCard";
import { CloudBadge, CloudCard, BoardCard, Countdown, HAND, Mascot, endOf } from "@/components/OfferDeco";
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
  if (f) out.push(f.code ? `${t("Use the event code at checkout")}: ${f.code}` : t("We take the discount off these toys for you automatically."));
  if (c) {
    out.push(t("We apply this for you at checkout. No code needed!"));
    if (c.kind === "free_shipping") { if ((c.minQty ?? 0) > 0) out.push(`${t("Minimum items")}: ${c.minQty}`); else if (c.minSpendCents > 0) out.push(`${t("Minimum spend")}: ${usd(c.minSpendCents)}`); if (c.area === "PHNOM_PENH") out.push(t("Phnom Penh deliveries only.")); }
    else if (c.kind.startsWith("spend") && c.minSpendCents > 0) out.push(`${t("Minimum spend")}: ${usd(c.minSpendCents)}`);
    if (c.kind === "bogo" || c.kind === "spend_gift") out.push(t("We add your free gift to your order automatically."));
  }
  void promotions; return out;
}
/** The offer details banner: your picture IS the banner. On tablet and desktop the live discount goes in the picture's white cloud, the live countdown in its white board and the live offer name on the empty left side (all scaled with the picture). On a phone the picture is a short strip and the same live parts sit under it on white cards. */
function DetailBanner({ src, k, offer, tone, badge, end, t }: { src: string; k: number; offer: Offer; tone: (typeof TONES)[Tone]; badge: { top?: string; big: string; bottom?: string } | null; end: number; t: (s: string) => string }) {
  const ref = useRef<HTMLDivElement>(null); const [w, setW] = useState(1920);
  useEffect(() => { const el = ref.current; if (!el) return; const upd = () => setW(el.clientWidth); const ro = new ResizeObserver(upd); ro.observe(el); upd(); return () => ro.disconnect(); }, []);
  const root = typeof document === "undefined" ? 16 : parseFloat(getComputedStyle(document.documentElement).fontSize) || 16; const sc = (w / 1920) * (16 / root);
  const head = (big: boolean) => (<>
    <nav aria-label="Breadcrumb" className={`font-bold text-[#1F4E9C] ${big ? "mb-4 text-[1.15rem]" : "mb-3 text-sm"}`}><Link to="/" className="hover:underline">{t("Home")}</Link> <span aria-hidden="true">/</span> <Link to="/shop?sale=1" className="hover:underline">{t("Special Offer")}</Link> <span aria-hidden="true">/</span> <span className="opacity-70">{offer.title}</span></nav>
    <span className={`inline-flex items-center rounded-full font-extrabold shadow-soft ${tone.badge} ${big ? "px-6 py-1.5 text-[1.25rem]" : "px-4 py-1 text-sm"}`}>{offer.badge}</span>
    <h1 className={`break-words font-['Nunito'] font-black tracking-tight text-[#1F4E9C] [paint-order:stroke_fill] ${big ? `mt-4 leading-[1.05] [-webkit-text-stroke:10px_#fff] ${offer.title.length > 26 ? "text-[4.25rem]" : "text-[5.5rem]"}` : "mt-3 text-4xl leading-tight [-webkit-text-stroke:6px_#fff]"}`}>{offer.title}</h1>
    <p className={`${HAND} inline-block -rotate-2 bg-[#FFB6CD] font-bold text-[#1F4E9C] shadow-soft [clip-path:polygon(0_0,100%_0,95%_50%,100%_100%,0_100%,5%_50%)] ${big ? "mt-5 px-12 py-2 text-[2rem]" : "mt-3 px-8 py-1.5 text-xl"}`}>{t("Don't miss out on these amazing deals!")}</p></>);
  return (<section aria-label={offer.title}>
    <div ref={ref} className="relative hidden w-full overflow-hidden md:block">
      <ScaledBanner src={src} k={k} fetchPriority="high" />
      <div className="absolute flex items-center justify-start" style={{ left: "4%", top: "5%", width: "47%", height: "90%" }}><div className="w-[56rem] shrink-0 origin-left text-left" style={{ transform: `scale(${sc})` }}>{head(true)}</div></div>
      {badge && <div className="absolute flex items-center justify-center" style={{ left: "79.9%", top: "16%", width: "17.7%", height: "34.7%" }}><div className="w-[20rem] shrink-0" style={{ transform: `scale(${sc * 0.78})` }}><CloudBadge lg {...badge} /></div></div>}
      {end > 0 && <div className="absolute flex items-center justify-center" style={{ left: "76.9%", top: "56.6%", width: "22.4%", height: "26.2%" }}><div className="w-[24rem] shrink-0" style={{ transform: `scale(${sc * 0.83})` }}><Countdown lg end={end} t={t} /></div></div>}
    </div>
    <div className="md:hidden">
      <img src={src} alt="" decoding="async" className="h-40 w-full object-cover object-[38%_50%]" />
      <div className="space-y-4 bg-gradient-to-b from-[#CFE3FB] to-[#EAF3FF] px-4 pb-6 pt-4 text-center"><div>{head(false)}</div>
        <div className="mx-auto w-full max-w-[24rem] space-y-3">{badge && <CloudCard><CloudBadge {...badge} /></CloudCard>}{end > 0 && <BoardCard><Countdown end={end} t={t} /></BoardCard>}</div></div></div>
  </section>);
}
/** Page opened by "View Details" on an offer card: sky banner with the countdown, then the product-page style details, then the products in the offer. */
export default function OfferDetail() {
  const { id } = useParams(); const { t, lang } = useI18n(); const { data: all } = useListedProducts(); const { promotions } = usePromotions(); const { settings } = useSettings(); const [saved, setSaved] = useState(false);
  const offer = all ? buildOffers(promotions, all, lang, t).find((o) => o.id === id) : undefined;
  useTitle(all ? offer?.title ?? t("Special Offer") : undefined);
  if (!all) return <Skeleton />;
  if (!offer) return (<div className="mx-auto max-w-lg space-y-4 rounded-3xl bg-white p-8 text-center shadow-soft"><p className="text-5xl" aria-hidden="true">🎈</p><h1 className="text-2xl font-extrabold text-[#1F4E9C]">{t("Sorry, this offer has ended or isn't available.")}</h1><Link to="/shop?sale=1" className="inline-block rounded-full bg-[#7A3FD8] px-6 py-2.5 font-extrabold text-white hover:bg-[#6930C4]">{t("See all special offers")}</Link></div>);
  const tone = TONES[offer.tone], badge = badgeOf(offer, t), { products, scope, gift } = offerScope(offer, all, t); const e = endOf(offer.rule?.endDate ?? offer.festival?.endDate); const end = e > Date.now() ? e : 0; const code = offer.festival?.code;
  const go = () => document.getElementById("offer-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const useCode = () => { try { sessionStorage.setItem("ct-event-code", code ?? ""); } catch { /* private mode */ } setSaved(true); };
  return (<div className="relative left-1/2 -mt-5 w-screen -translate-x-1/2 space-y-8 sm:-mt-8">
    <DetailBanner src={settings.offerDetailImage || "/img/offer-detail-banner.jpg"} k={sizeOf(settings, "offer-detail")} offer={offer} tone={tone} badge={badge} end={end} t={t} />
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
          {code && <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#EFE6FF] p-3 text-sm"><span className="font-bold">🎟️ {t("Quick event code")}:</span><span className="rounded-xl bg-white px-4 py-1.5 font-mono text-base font-extrabold text-[#4B2A99]">{code}</span><button type="button" onClick={useCode} className="rounded-full bg-[#7A3FD8] px-4 py-1.5 text-xs font-extrabold text-white hover:bg-[#6930C4]">{t("Apply to Bag")}</button>{saved && <span role="status" className="text-xs">{t("Saved! We'll fill it in for you at checkout.")} <Link to="/cart" className="font-bold underline">{t("Go to cart")}</Link></span>}</div>}
          <div className="flex flex-wrap gap-3 pt-1"><button type="button" onClick={go} className={`min-h-11 rounded-full px-7 font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${tone.btn}`}>{t("Shop offer products")} ↓</button><Link to="/shop?sale=1" className="inline-flex min-h-11 items-center rounded-full border border-sky-border bg-white px-6 font-bold hover:bg-sky-pale">{t("All special offers")}</Link></div></div></section>
      <section id="offer-products" className="scroll-mt-24"><div className="mb-4 flex items-end justify-between gap-3"><h2 className="text-2xl font-extrabold text-[#1F4E9C]">{t("Products in this offer")}</h2><Link to="/shop" className="text-sm font-bold text-[#4A86D8] hover:underline">{t("See all")} →</Link></div>
        {products.length === 0 ? <p className="rounded-xl2 bg-sky-pale p-8 text-center text-mute">{t("We couldn't find any toys like that. Try another word!")}</p> : <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">{products.map((p) => <OfferProductCard key={p.id} p={p} />)}</div>}</section></div>
  </div>);
}
