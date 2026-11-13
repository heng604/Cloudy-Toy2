import { useState } from "react";
import { Link } from "react-router-dom";
import { type Product, FALLBACK_IMG, money, isPreorder, nameFor } from "@shared/products";
import { productPromo } from "@shared/promotions";
import { useCart } from "./CartProvider";
import { useI18n } from "@/lib/i18n";
import { usePromotions } from "@/lib/store";
import SafeImg from "./SafeImg";
const FAV_KEY = "ct-fav";
const readFav = (): string[] => { try { const v = JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]"); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } };
/** % off one product right now (category / product / festival rule, or its own sale price). 0 = no discount. */
export function discountOf(p: Product, promo: ReturnType<typeof productPromo>) { return promo.offCents > 0 ? promo.percent : p.salePrice != null && p.price > 0 && p.salePrice < p.price ? Math.round((1 - p.salePrice / p.price) * 100) : 0; }
/** Card used on the Special Offer page: pink "-30%" badge, heart (kept in this browser), old and new price, small Add to Cart button. */
export default function OfferProductCard({ p }: { p: Product }) {
  const { add } = useCart(); const { t, lang } = useI18n(); const { promotions } = usePromotions(); const promo = productPromo(p, promotions.campaigns, promotions.festivals);
  const [fav, setFav] = useState(() => readFav().includes(p.id)); const out = p.stock <= 0; const pre = isPreorder(p); const off = discountOf(p, promo); const name = nameFor(p, lang); const img = p.images[0];
  const was = promo.offCents > 0 ? promo.baseCents / 100 : p.price; const now = promo.offCents > 0 ? promo.finalCents / 100 : p.salePrice ?? p.price;
  const toggle = () => { const next = !fav; setFav(next); try { const rest = readFav().filter((x) => x !== p.id); localStorage.setItem(FAV_KEY, JSON.stringify(next ? [...rest, p.id] : rest)); } catch { /* private mode: the heart still works for this visit */ } };
  return (<article className="group flex flex-col overflow-hidden rounded-3xl border border-white bg-white/90 p-2 shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
    <div className="relative overflow-hidden rounded-2xl bg-sky-pale">
      {off > 0 && !out && <span className="absolute left-2 top-2 z-10 rounded-full bg-[#FF5C93] px-3 py-1 text-sm font-extrabold text-white shadow-soft">-{off}%</span>}
      {out && <span className="absolute left-2 top-2 z-10 rounded-full bg-slate-700 px-3 py-1 text-xs font-extrabold text-white">{t("Out of stock")}</span>}
      <button type="button" aria-pressed={fav} aria-label={t("Favourite")} onClick={toggle} className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#4A86D8] shadow-soft hover:scale-110"><svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? "#FF5C93" : "none"} stroke={fav ? "#FF5C93" : "currentColor"} strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 5.6a5.200 5.200 0 0 0-7.400 0L12 7l-1.400-1.400a5.200 5.200 0 0 0-7.400 7.400L12 21.800l8.800-8.800a5.200 5.200 0 0 0 0-7.400z" /></svg></button>
      <Link to={`/product/${p.slug}`} className="block"><SafeImg key={img?.src} src={img?.src ?? FALLBACK_IMG} alt={img?.alt ?? name} loading="lazy" decoding="async" width={400} height={300} className={`aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105 ${out ? "opacity-60 grayscale" : ""}`} /></Link></div>
    <div className="flex flex-1 flex-col gap-2 px-2 pb-2 pt-3">
      <Link to={`/product/${p.slug}`} className="line-clamp-2 break-words text-sm font-extrabold leading-snug text-[#1F4E9C] hover:underline sm:text-base">{name}</Link>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
        <p className="flex flex-wrap items-baseline gap-x-2 leading-none">{now < was && <s className="text-xs font-bold text-mute">{money(was)}</s>}<span className={`text-lg font-extrabold ${now < was ? "text-[#FF3D83]" : "text-ink"}`}>{money(now)}</span></p>
        <button type="button" disabled={out} onClick={() => add(p.id)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#4A86D8] px-3.5 text-xs font-bold text-white shadow-soft hover:bg-[#3A74C6] disabled:cursor-not-allowed disabled:opacity-50"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.500" /><circle cx="18" cy="20" r="1.500" /><path d="M2 3h3l2.700 12.500a1.500 1.500 0 0 0 1.500 1.200h8.600a1.500 1.500 0 0 0 1.500-1.100L21 7H6" /></svg>{out ? t("Out of stock") : pre ? t("Pre-order now") : t("Add to Cart")}</button></div></div>
  </article>);
}
