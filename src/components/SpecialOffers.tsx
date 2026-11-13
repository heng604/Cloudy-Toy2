import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OfferCard, { buildOffers } from "@/components/OfferCard";
import OfferProductCard, { discountOf } from "@/components/OfferProductCard";
import { usePromotions } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { categoriesOf, type Product } from "@shared/products";
import { inSpecialOffer, liveCampaigns, liveFestivals, festivalName, festivalText, productPromo, orderCampaigns } from "@shared/promotions";
const HAND = "font-['Caveat']";
/** Little cloud mascot (drawn here so the page works with no extra files). Put your own picture at public/img/offer-mascot.png and it is used instead. */
function Mascot({ className = "" }: { className?: string }) {
  const [custom, setCustom] = useState(true);
  if (custom) return <img src="/img/offer-mascot.png" alt="" className={className} onError={() => setCustom(false)} />;
  return (<svg viewBox="0 0 260 210" className={className} aria-hidden="true">
    <g fill="#CFE3F7" stroke="#CFE3F7" strokeWidth="8" strokeLinejoin="round"><circle cx="78" cy="112" r="46" /><circle cx="128" cy="84" r="58" /><circle cx="180" cy="112" r="46" /><rect x="40" y="108" width="180" height="62" rx="31" /></g>
    <g fill="#fff"><circle cx="78" cy="112" r="46" /><circle cx="128" cy="84" r="58" /><circle cx="180" cy="112" r="46" /><rect x="40" y="108" width="180" height="62" rx="31" /></g>
    <ellipse cx="106" cy="100" rx="8" ry="10" fill="#26303F" /><ellipse cx="152" cy="100" rx="8" ry="10" fill="#26303F" /><circle cx="109" cy="96" r="3" fill="#fff" /><circle cx="155" cy="96" r="3" fill="#fff" />
    <ellipse cx="90" cy="120" rx="11" ry="7" fill="#FFB3C7" opacity=".7" /><ellipse cx="168" cy="120" rx="11" ry="7" fill="#FFB3C7" opacity=".7" />
    <path d="M115 116q14 20 28 0z" fill="#E0456B" stroke="#26303F" strokeWidth="2.500" strokeLinejoin="round" /><path d="M123 125q6 6 12 0" fill="#FF8FB0" />
    <path d="M62 170v-18h136v18a24 24 0 0 1-24 24H86a24 24 0 0 1-24-24z" fill="#6FA8E8" /><path d="M86 152l10-22M174 152l-10-22" stroke="#6FA8E8" strokeWidth="9" strokeLinecap="round" /><circle cx="96" cy="136" r="4" fill="#FFD84D" /><circle cx="164" cy="136" r="4" fill="#FFD84D" />
    <ellipse cx="62" cy="168" rx="16" ry="13" fill="#fff" stroke="#CFE3F7" strokeWidth="3" /><ellipse cx="198" cy="168" rx="16" ry="13" fill="#fff" stroke="#CFE3F7" strokeWidth="3" /></svg>);
}
const endOf = (d?: string) => (d ? new Date(`${d}T23:59:59+07:00`).getTime() : 0); // offers end at the end of their last day, shop time (Cambodia)
function Countdown({ end, t }: { end: number; t: (s: string) => string }) {
  const [now, setNow] = useState(Date.now()); useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const ms = Math.max(0, end - now), s = Math.floor(ms / 1000); const parts: [number, string][] = [[Math.floor(s / 86400), "Days"], [Math.floor((s % 86400) / 3600), "Hours"], [Math.floor((s % 3600) / 60), "Min"], [s % 60, "Sec"]];
  return (<div><p className="flex items-center justify-center gap-1.5 text-sm font-extrabold text-[#1F4E9C]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF5C93" strokeWidth="2.400" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.500 2M9 2h6" /></svg>{t("Limited Time Only!")}</p>
    <div className="mt-2 grid grid-cols-4 gap-2" role="timer" aria-label={t("Limited Time Only!")}>{parts.map(([n, l]) => <div key={l} className="rounded-xl border-2 border-[#FFD3E3] bg-white px-1 py-1.5 text-center shadow-soft"><p className="text-xl font-extrabold leading-none text-[#1F4E9C] sm:text-2xl">{String(n).padStart(2, "0")}</p><p className="mt-1 text-[10px] font-bold text-mute">{t(l)}</p></div>)}</div></div>);
}
/** The page behind the "Special Offer" button: sky banner with the biggest discount and a countdown, a category filter, the offer products and the promotion cards. */
export default function SpecialOffers({ all, festivalId }: { all: Product[]; festivalId?: string | null }) {
  const { t, lang } = useI18n(); const { promotions } = usePromotions(); const [open, setOpen] = useState<string | null>(null); const [saved, setSaved] = useState(""); const [cat, setCat] = useState("");
  const fests = liveFestivals(promotions.festivals); const hero = fests.find((f) => f.id === festivalId) ?? fests[0]; const rules = liveCampaigns(promotions.campaigns);
  const list = all.filter((p) => (festivalId && hero ? hero.productIds.includes(p.id) : inSpecialOffer(p, promotions.campaigns, promotions.festivals)));
  const cats = categoriesOf(list); const shown = cat && cats.includes(cat) ? list.filter((p) => p.category === cat) : list;
  const up = Math.max(0, ...list.map((p) => discountOf(p, productPromo(p, promotions.campaigns, promotions.festivals))), ...orderCampaigns(promotions.campaigns).map((c) => (c.kind === "spend_percent" ? c.percent : 0)));
  const ends = [...rules, ...fests].map((x) => endOf(x.endDate)).filter((e) => e > Date.now()); const end = ends.length ? Math.min(...ends) : 0;
  const offers = buildOffers(promotions, all, lang, t); const total = rules.length + fests.length;
  const useCode = (code: string) => { try { sessionStorage.setItem("ct-event-code", code); } catch { /* private mode: the code is shown anyway */ } setSaved(code); };
  const spark = (c: string, cls: string) => <span aria-hidden="true" className={`pointer-events-none absolute ${cls}`} style={{ color: c }}>✦</span>;
  return (<div className="space-y-6">
    <section className="relative overflow-hidden rounded-3xl border border-white bg-gradient-to-b from-[#BFDDFB] via-[#D9EBFF] to-[#EEF6FF] p-5 shadow-soft sm:p-8">
      <span aria-hidden="true" className="pointer-events-none absolute -left-10 bottom-[-3rem] h-32 w-72 rounded-full bg-white/80 blur-xl" /><span aria-hidden="true" className="pointer-events-none absolute -right-8 bottom-[-3rem] h-32 w-80 rounded-full bg-white/80 blur-xl" />
      {spark("#FFD84D", "left-4 top-5 text-3xl")}{spark("#FFD84D", "left-[38%] top-24 text-2xl")}{spark("#FFB6CD", "left-[44%] top-3 text-xl")}{spark("#8EC5FF", "right-[30%] top-8 text-lg")}
      <div className="relative grid items-center gap-4 lg:grid-cols-[1.25fr_1fr_1fr]">
        <div className="text-center lg:text-left">
          {hero && <span className="mb-2 inline-block rounded-full bg-white/80 px-3 py-1 text-xs font-extrabold text-[#C2305F]">✨ {festivalName(hero, lang)}</span>}
          <h1 className={`${HAND} text-6xl font-bold leading-none text-[#1F4E9C] drop-shadow-[0_2px_0_#fff] sm:text-7xl`}>{t("Special Offer")}</h1>
          <p className={`${HAND} mt-4 inline-block -rotate-2 bg-[#FFB6CD] px-8 py-2 text-xl font-bold text-[#1F4E9C] shadow-soft [clip-path:polygon(0_0,100%_0,95%_50%,100%_100%,0_100%,5%_50%)] sm:text-2xl`}>{t("Don't miss out on these amazing deals!")}</p>
          <p className={`${HAND} mt-3 text-xl font-bold text-[#1F4E9C] sm:text-2xl`}>{hero && festivalText(hero, lang) ? festivalText(hero, lang) : `${t("Collect more happiness, for less!")} ♡`}</p></div>
        <div className="hidden justify-center lg:flex"><Mascot className="h-52 w-auto max-w-full object-contain drop-shadow-lg" /></div>
        <div className="mx-auto w-full max-w-xs space-y-3">
          {up > 0 && <div className="mx-auto w-44 rounded-[2.5rem] bg-white px-4 py-3 text-center shadow-lift"><p className="text-sm font-extrabold text-[#1F4E9C]">{t("UP TO")}</p><p className="text-5xl font-extrabold leading-none text-[#FF3D83]">{up}%</p><p className="text-sm font-extrabold text-[#1F4E9C]">{t("OFF")}</p></div>}
          {end > 0 && <Countdown end={end} t={t} />}</div></div></section>
    {hero?.code && <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-white p-3 text-sm shadow-soft"><span className="font-bold">🎟️ {t("Quick event code")}:</span><span className="rounded-xl bg-[#EFE6FF] px-4 py-1.5 font-mono text-base font-extrabold text-[#4B2A99]">{hero.code}</span>
      <button type="button" onClick={() => useCode(hero.code!)} className="rounded-full bg-[#7A3FD8] px-4 py-1.5 text-xs font-extrabold text-white hover:bg-[#6930C4]">{t("Apply to Bag")}</button>
      {saved === hero.code && <span role="status" className="text-xs">{t("Saved! It is filled in at checkout.")} <Link to="/cart" className="font-bold underline">{t("Go to cart")}</Link></span>}</div>}
    {total > 0 && <section><div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-xl font-extrabold text-[#1F4E9C]">{t("Active Promotions & Rewards")}</h2><p className="text-sm text-mute">{t("Unlock discounts and freebies automatically at checkout")}</p></div><span className="shrink-0 rounded-full bg-[#DDF6E8] px-3 py-1 text-xs font-extrabold text-[#2F8F5B]">{total} {t("Live Offers")}</span></div>
      <div className="grid gap-4 lg:grid-cols-2">{offers.map((o) => <OfferCard key={o.id} o={o} t={t} onClick={() => setOpen(open === o.id ? null : o.id)} open={open === o.id} />)}</div></section>}
    {total === 0 && list.length === 0 && <p className="rounded-xl2 bg-sky-pale p-6 text-center text-mute">{t("No special offers right now. Please check back soon!")}</p>}
    {list.length > 0 && <div className="grid items-start gap-5 lg:grid-cols-[14rem_1fr]">
      <aside className="rounded-3xl border border-white bg-white/90 p-4 shadow-soft lg:sticky lg:top-24 lg:p-5"><h2 className="flex items-center gap-2 text-lg font-extrabold text-[#1F4E9C]"><svg width="20" height="20" viewBox="0 0 24 24" fill="#4A86D8" aria-hidden="true"><path d="M20.600 13.400 13.400 20.600a2 2 0 0 1-2.800 0L2 12V2h10l8.600 8.600a2 2 0 0 1 0 2.800zM7 7.500a1.500 1.500 0 1 0 0-.01z" /></svg>{t("Filter by")}</h2>
        <hr className="my-3 border-sky-border" /><p className="mb-2 text-sm font-extrabold text-[#1F4E9C]">{t("Category")}</p>
        <div role="radiogroup" aria-label={t("Category")} className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
          {["", ...cats].map((c) => <label key={c || "all"} className={`flex shrink-0 cursor-pointer items-center gap-2.5 rounded-full px-2 py-1.5 text-sm font-semibold hover:bg-sky-pale lg:rounded-xl ${cat === c ? "text-[#1F4E9C]" : "text-ink"}`}><input type="radio" name="offer-cat" checked={cat === c} onChange={() => setCat(c)} className="h-4 w-4 accent-[#4A86D8]" />{c || t("All Products")}</label>)}</div></aside>
      <section aria-label={t("Featured Cloudy Products")}>{shown.length === 0 ? <p className="rounded-xl2 bg-sky-pale p-8 text-center">{t("No products match.")}</p>
        : <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">{shown.map((p) => <OfferProductCard key={p.id} p={p} />)}</div>}</section></div>}
    {list.length === 0 && total > 0 && <p className="rounded-xl2 bg-sky-pale p-6 text-center">{t("No products match.")} <Link to="/shop" className="underline">{t("Browse all products")}</Link></p>}
    <section className="relative flex flex-wrap items-center justify-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-[#E4EEFF] via-[#EEE9FF] to-[#FFE6F0] px-5 py-4 shadow-soft sm:justify-between sm:px-8">
      <Mascot className="hidden h-16 w-auto sm:block" /><p className={`${HAND} text-center text-2xl font-bold text-[#1F4E9C] sm:text-3xl`}>{t("Shop now and enjoy special savings!")} <span aria-hidden="true" className="text-[#8E7CF0]">♡</span></p>
      <Link to="/shop" className={`${HAND} rounded-full bg-[#FF7BA9] px-8 py-2.5 text-2xl font-bold text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-[#F2679A]`}>{t("Happy Shopping")} ♡</Link></section>
  </div>);
}
