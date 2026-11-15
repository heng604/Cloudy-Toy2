import { Link } from "react-router-dom";
import { type Product, FALLBACK_IMG, badgeLabels, LABEL_CLASS, LABEL_SHORT, money, isPreorder, nameFor } from "@shared/products";
import { useCart } from "./CartProvider";
import { useI18n } from "@/lib/i18n";
import SafeImg from "./SafeImg";
import { usePromotions } from "@/lib/store";
import { useWishlist } from "@/lib/wishlist";
import { productPromo } from "@shared/promotions";
const CartIcon = ({ s = 16 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.500" /><circle cx="18" cy="20" r="1.500" /><path d="M2 3h3l2.700 12.500a1.500 1.500 0 0 0 1.500 1.200h8.600a1.500 1.500 0 0 0 1.500-1.100L21 7H6" /></svg>;
/** Shop card: white rounded card, picture on a sky background with badge + heart, pink price (with the "% OFF" pill), blue Add to Cart button. */
export default function ProductCard({ p, compact = false }: { p: Product; compact?: boolean }) {
  const { add } = useCart(); const { t, lang } = useI18n(); const { promotions } = usePromotions(); const promo = productPromo(p, promotions.campaigns, promotions.festivals); const { has, toggle } = useWishlist();
  const img = p.images[0]; const out = p.stock <= 0; const pre = isPreorder(p); const name = nameFor(p, lang); const liked = has(p.id);
  // price: the promotion price when a campaign / festival applies, otherwise the product's own sale price, otherwise the normal price
  const promoOn = promo.offCents > 0, saleOn = !promoOn && !!p.salePrice && p.salePrice < p.price;
  const now = promoOn ? promo.finalCents / 100 : saleOn ? (p.salePrice as number) : p.price, was = promoOn ? promo.baseCents / 100 : p.price;
  const percent = promoOn ? promo.percent : saleOn ? Math.round((1 - (p.salePrice as number) / p.price) * 100) : 0;
  // badges on the picture: "Out of stock" when sold out, otherwise the one label the admin ticked (New is the sparkly blue pill)
  const tags: { text: string; cls: string }[] = [];
  if (out) tags.push({ text: t("Out of stock"), cls: "bg-slate-700 text-white" });
  if (!out) for (const l of badgeLabels(p)) tags.push(l.id === "new_arrival" ? { text: `✦ ${lang === "km" ? LABEL_SHORT[l.id].km : LABEL_SHORT[l.id].en}`, cls: "bg-[#4A9BF0] text-white" } : { text: lang === "km" ? LABEL_SHORT[l.id].km : LABEL_SHORT[l.id].en, cls: LABEL_CLASS[l.id] });
  return (
    <article className={`group flex h-full flex-col border-2 border-[#DCEBFB] bg-white transition duration-200 hover:-translate-y-1.5 hover:border-[#BFDDFA] hover:shadow-lift ${compact ? "rounded-2xl p-1.5 shadow-sm" : "rounded-[1.6rem] p-2 shadow-soft"}`}>
      <div className={`relative overflow-hidden bg-gradient-to-b from-[#CFE6FF] to-[#EAF5FF] ${compact ? "rounded-xl" : "rounded-[1.2rem]"}`}>
        <Link to={`/product/${p.slug}`} className="block" aria-label={name}>
          <SafeImg key={img?.src} src={img?.src ?? FALLBACK_IMG} alt={img?.alt ?? name} loading="lazy" decoding="async" width={400} height={300} className={`${compact ? "aspect-[16/10]" : "aspect-[4/3]"} w-full object-cover transition-transform duration-300 group-hover:scale-105 ${out ? "opacity-60 grayscale" : ""}`} />
        </Link>
        {tags.length > 0 && <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col items-start gap-1 sm:left-3 sm:top-3">{tags.map((g) => <span key={g.text} className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide shadow-soft sm:px-3 sm:text-xs ${g.cls}`}>{g.text}</span>)}</div>}
        <button type="button" aria-pressed={liked} aria-label={liked ? t("Remove from favourites") : t("Add to favourites")} onClick={() => toggle(p.id)} className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-soft transition hover:scale-110 active:scale-95 sm:right-3 sm:top-3 sm:h-9 sm:w-9">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill={liked ? "#FF5C8A" : "none"} stroke={liked ? "#FF5C8A" : "#4A86D8"} strokeWidth="2.200" strokeLinejoin="round"><path d="M12 20.500s-7.500-4.600-9-9.400C2 7.800 4 5 7 5c2 0 3.600 1.100 5 3 1.400-1.900 3-3 5-3 3 0 5 2.800 4 6.100-1.500 4.800-9 9.400-9 9.400z" /></svg></button>
      </div>
      <div className={`flex flex-1 flex-col ${compact ? "gap-1 px-1.5 pb-1 pt-2" : "gap-2 px-2 pb-2 pt-3"}`}>
        <Link to={`/product/${p.slug}`} className={`block break-words font-display font-semibold leading-snug text-[#1F3F8F] hover:underline ${compact ? "line-clamp-2 text-xs" : "line-clamp-2 min-h-[2.6rem] text-[15px] sm:text-base"}`}>{name}</Link>
        <p className="flex min-h-[1.75rem] flex-wrap items-center gap-x-2 gap-y-1">
          {percent > 0 && <s className="text-xs text-[#8A9BB5] sm:text-sm">{money(was)}</s>}
          <span className={`font-display font-bold text-[#E8336D] ${compact ? "text-sm" : "text-lg sm:text-xl"}`}>{money(now)}</span>
          {percent > 0 && <span className="rounded-full bg-[#FF5C8A] px-2.5 py-0.5 text-[11px] font-extrabold uppercase text-white sm:text-xs">{percent}% {t("OFF")}</span>}
        </p>
        {compact && <p className={`flex items-center gap-1 text-[11px] font-bold ${out ? "text-slate-500" : "text-[#2F8F5B]"}`}><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${out ? "bg-slate-400" : "bg-[#2F8F5B]"}`} />{out ? t("Out of stock") : t("In Stock")}</p>}
        <button type="button" disabled={out} onClick={() => add(p.id)} className={`btn-blue mt-auto flex w-full items-center justify-center gap-2 rounded-full font-bold disabled:cursor-not-allowed ${compact ? "min-h-8 text-xs" : "min-h-11 text-sm sm:text-base"}`}>{!out && <CartIcon s={compact ? 13 : 17} />}{out ? t("Out of stock") : pre ? t("Pre-order now") : t("Add to cart")}</button>
      </div>
    </article>
  );
}
