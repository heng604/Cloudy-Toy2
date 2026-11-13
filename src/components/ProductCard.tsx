import { Link } from "react-router-dom";
import { type Product, FALLBACK_IMG, badgeLabels, LABEL_CLASS, LABEL_SHORT, money, isPreorder, nameFor } from "@shared/products";
import { useCart } from "./CartProvider";
import { useI18n } from "@/lib/i18n";
import SafeImg from "./SafeImg";
import { usePromotions } from "@/lib/store";
import { productPromo } from "@shared/promotions";
export default function ProductCard({p,compact=false}:{p:Product;compact?:boolean}) {
  const { add } = useCart(); const { t, lang } = useI18n(); const { promotions } = usePromotions(); const promo = productPromo(p, promotions.campaigns, promotions.festivals);
  const img = p.images[0];
  const out = p.stock<=0; const pre = isPreorder(p); const name = nameFor(p, lang);
  // badges: "Out of stock" when sold out, then (only when it is in stock) one badge for every label the admin ticked (New / Restock / Limited Edition / Pre-Order)
  const tags: { text: string; cls: string }[] = [];
  if (out) tags.push({ text: t("Out of stock"), cls: "bg-slate-700 text-white" });
  if (!out && promo.offCents > 0) tags.push({ text: `-${promo.percent}%`, cls: "bg-rose-500 text-white" });
  if (!out) for (const l of badgeLabels(p)) tags.push({ text: lang === "km" ? LABEL_SHORT[l.id].km : LABEL_SHORT[l.id].en, cls: LABEL_CLASS[l.id] });
  return (
    <article className={`group overflow-hidden border border-sky-border bg-white transition-transform duration-200 hover:-translate-y-1.5 ${compact?"rounded-2xl shadow-sm hover:shadow-soft":"rounded-xl2 shadow-soft hover:shadow-lift"}`}>
      <Link to={`/product/${p.slug}`} className="relative block overflow-hidden bg-sky-pale">
        {tags.length > 0 && <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1">{tags.map((g) => <span key={g.text} className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide shadow-soft ${g.cls}`}>{g.text}</span>)}</div>}
        <SafeImg key={img?.src} src={img?.src??FALLBACK_IMG} alt={img?.alt??name} loading="lazy" decoding="async" width={400} height={300} className={`${compact?"aspect-[16/10]":"aspect-[4/3]"} w-full object-cover transition-transform duration-300 group-hover:scale-105 ${out ? "opacity-60 grayscale" : ""}`}/>
      </Link>
      <div className={compact?"space-y-1 p-2.5":"space-y-1.5 p-3 sm:space-y-2 sm:p-4"}>
        <Link to={`/product/${p.slug}`} className={`block break-words font-bold leading-snug hover:underline ${compact?"line-clamp-2 text-xs":""}`}>{name}</Link>
        {!compact&&<p className="text-mute text-sm">{p.category}</p>}
        <p className={`font-extrabold ${compact?"text-sm":""}`}>{promo.offCents>0?<><span className="text-rose-600">{money(promo.finalCents/100)}</span> <s className="text-mute font-normal">{money(promo.baseCents/100)}</s></>:p.salePrice?<><span>{money(p.salePrice)}</span> <s className="text-mute font-normal">{money(p.price)}</s></>:money(p.price)}</p>
        {compact&&<p className={`flex items-center gap-1 text-[11px] font-bold ${out?"text-slate-500":"text-[#2F8F5B]"}`}><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${out?"bg-slate-400":"bg-[#2F8F5B]"}`}/>{out?t("Out of stock"):t("In Stock")}</p>}
        <button type="button" disabled={out} onClick={()=>add(p.id)} className={compact?"flex min-h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-[#4A86D8] text-xs font-bold text-white hover:bg-[#3A74C6] disabled:cursor-not-allowed disabled:opacity-50":"min-h-11 w-full rounded-full bg-sky font-bold hover:bg-sky-hover disabled:cursor-not-allowed disabled:opacity-50"}>{compact&&!out&&<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.700 12.500a1.500 1.500 0 0 0 1.500 1.200h8.600a1.500 1.500 0 0 0 1.500-1.100L21 7H6"/></svg>}{out?t("Out of stock"):pre?t("Pre-order now"):t("Add to cart")}</button>
      </div>
    </article>
  );
}
