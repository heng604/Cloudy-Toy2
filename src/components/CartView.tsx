import { Link } from "react-router-dom";
import { useCart } from "@/components/CartProvider";
import { FALLBACK_IMG, isValidOption, optionImageOf, money, preorderPhase, windowText, dayShort } from "@shared/products";
import type { CartProduct } from "@shared/cartTypes";
import type { Line as CartLine } from "@/components/CartProvider";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { usePromotions } from "@/lib/store";
import { autoDiscounts, autoTotal, bogoGifts, freeShippingRule, fullPriceCents } from "@shared/promotions";
import { memberBenefits } from "@shared/membership";
import { useMembership } from "@/lib/membership";
import { MemberPill, MemberPanel, PageHead, PointsBox, SecHead, Line, bigBtn, cardTitle } from "@/components/cartUi";

const iconBtn = "grid h-10 w-10 place-items-center rounded-full text-lg font-bold text-[#2B1A8F] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

function CloudArt() {
  return (
    <svg viewBox="0 0 200 120" className="mx-auto h-28 w-auto" aria-hidden="true">
      <path d="M52 92a28 28 0 0 1 8-55 38 38 0 0 1 74-6 31 31 0 0 1 40 61z" fill="#8ECCFF" />
      <path d="M70 92a20 20 0 0 1 6-39 27 27 0 0 1 52-4 22 22 0 0 1 28 43z" fill="#EAF5FF" />
      <circle cx="92" cy="70" r="3.5" fill="#2f4156" /><circle cx="116" cy="70" r="3.5" fill="#2f4156" />
      <path d="M97 79q5 5 14 0" stroke="#2f4156" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function CartView({ products, telegram = "" }: { products: CartProduct[]; telegram?: string }) {
  const { lines, setQty, clear, ready } = useCart(); const { t } = useI18n(); const { user } = useAuth(); const { promotions } = usePromotions();
  const items = lines.map((l) => ({ l, p: products.find((p) => p.id === l.id) })).filter((x): x is { l: CartLine; p: CartProduct } => !!x.p);
  const totalQty = (id: string) => items.reduce((n, x) => n + (x.p.id === id ? x.l.qty : 0), 0); // the same toy in two options shares ONE stock
  const optBad = (x: { l: CartLine; p: CartProduct }) => !isValidOption(x.p.options ?? [], x.l.opt); // option missing, or the admin changed the choices since it was added
  const unit = (p: CartProduct) => p.salePrice ?? p.price;
  const subtotal = items.reduce((s, x) => s + unit(x.p) * x.l.qty, 0);
  const saved = items.reduce((s, x) => s + (x.p.salePrice ? (x.p.price - x.p.salePrice) * x.l.qty : 0), 0);
  const count = items.reduce((s, x) => s + x.l.qty, 0);
  const autos0 = autoDiscounts(items.map((x) => ({ category: x.p.category ?? "", lineCents: Math.round(unit(x.p) * 100) * x.l.qty, productId: x.p.id, qty: x.l.qty })), promotions.campaigns, promotions.festivals);
  const { tier: memTier } = useMembership(), subC = Math.round(subtotal * 100), memAll = memberBenefits(memTier, { subtotalCents: subC, leftCents: subC - autoTotal(autos0), preorderCents: items.reduce((n, x) => (x.p.preorder ? n + Math.round(unit(x.p) * 100) * x.l.qty : n), 0), fullPriceCents: fullPriceCents(items.map((x) => ({ p: x.p, lineCents: Math.round(unit(x.p) * 100) * x.l.qty })), promotions.campaigns, promotions.festivals) }), mem = memAll, autos = [...autos0, ...memAll.discounts], autoOff = autoTotal(autos) / 100; // the customer's membership level specials
  const gifts = bogoGifts(items.map((x) => ({ productId: x.p.id, category: x.p.category ?? "", qty: x.l.qty, lineCents: Math.round(unit(x.p) * 100) * x.l.qty })), promotions.campaigns).flatMap((g) => { const bp = products.find((p) => p.id === g.productId); return bp && (bp.stock ?? 0) > 0 ? [{ ...g, name: bp.name, qty: Math.min(g.qty, Math.max(0, (bp.stock ?? 0) - totalQty(bp.id))) }] : []; }).filter((g) => g.qty > 0);
  const cartInfo = { subtotalCents: Math.round(subtotal * 100), qty: count }, freeAll = freeShippingRule({ ...cartInfo, area: "PROVINCE" }, promotions.campaigns), freePP = freeAll ?? freeShippingRule({ ...cartInfo, area: "PHNOM_PENH" }, promotions.campaigns);
  const hasPre = items.some((x) => x.p.preorder);
  const closedPre = (p: CartProduct) => !!p.preorder && preorderPhase(p) !== "open"; // each pre-order item has its own dates
  const blocked = items.some((x) => (x.p.stock ?? Infinity) <= 0 || totalQty(x.p.id) > (x.p.stock ?? Infinity) || closedPre(x.p) || optBad(x));

  if (!ready) return <div className="h-64" aria-busy="true" />;

  if (!items.length) {
    return (
      <section className="mx-auto max-w-lg rounded-3xl border border-white bg-white/90 px-6 py-12 text-center shadow-soft">
        <CloudArt />
        <h1 className="mt-4 font-display text-3xl font-extrabold text-[#2B1A8F]">{t("Your cart is empty. Let's fill it with something cute!")}</h1>
        <p className="mt-2 text-mute">No toys here yet. Let&apos;s find something that will make a little one smile.</p>
        <Link to="/shop" className="btn-blue mt-6 inline-block rounded-full px-8 py-3 font-extrabold">{t("Find a toy you'll love")}</Link>
      </section>
    );
  }

  return (
    <div>
      <PageHead title={t("Your cart")} sub={`${count} ${count === 1 ? "toy" : "toys"} ready for a new home ♡`}><MemberPill /><button type="button" onClick={clear} className="rounded-full px-4 py-2 text-sm font-semibold text-mute hover:bg-white hover:text-ink">{t("Clear cart")}</button></PageHead>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_26rem]">
        <ul className="space-y-4">
          {items.map(({ l, p }) => {
            const stock = p.stock ?? Infinity;
            const out = stock <= 0;
            const over = !out && totalQty(p.id) > stock;
            const atMax = totalQty(p.id) >= stock;
            const needOpt = optBad({ l, p });
            return (
              <li key={`${l.id}|${l.opt ?? ""}`} className="flex gap-4 rounded-3xl border border-white bg-white/90 p-3 shadow-soft sm:p-5">
                <Link to={p.slug ? `/product/${p.slug}` : "/shop"} className="shrink-0 overflow-hidden rounded-2xl bg-sky-pale">
                  <img src={optionImageOf(p.options ?? [], l.opt) ?? p.image ?? FALLBACK_IMG} alt={p.name} width={112} height={112} loading="lazy" className="h-24 w-24 object-cover sm:h-28 sm:w-28" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {p.category && <p className="text-[11px] font-extrabold uppercase tracking-wide text-mute">{p.category}</p>}
                      <Link to={p.slug ? `/product/${p.slug}` : "/shop"} className="block font-display text-lg font-extrabold leading-snug text-[#2B1A8F] hover:underline">{p.name}</Link>
                      {l.opt && <p className="mt-0.5 text-sm font-semibold text-[#2F5FA8]">{l.opt}</p>}
                      <p className="mt-1 text-sm text-mute">
                        {p.salePrice ? <><span className="font-semibold text-ink">{money(p.salePrice)}</span> <s>{money(p.price)}</s></> : money(p.price)} each
                      </p>
                      {!p.salePrice && <p className="mt-0.5 text-xs font-bold text-[#5B3FC8]">{t("Full-price item (member eligible)")}</p>}
                    </div>
                    <p className="shrink-0 text-xl font-extrabold text-[#2B1A8F]">{money(unit(p) * l.qty)}</p>
                  </div>

                  {out && <p role="alert" className="text-sm font-semibold text-red-600">{t("Sorry, this toy just sold out. Could you remove it from your cart?")}</p>}
                  {needOpt && <p role="alert" className="text-sm font-semibold text-red-600">{t("Please pick an option for this toy.")} <Link to={p.slug ? `/product/${p.slug}` : "/shop"} className="underline">{t("Choose option")}</Link>{t(", then remove this line.")}</p>}
                  {over && <p role="alert" className="text-sm font-semibold text-red-600">{t("Only {n} left, so please lower the quantity a little.", { n: stock })}</p>}
                  {p.preorder && windowText(p) && (preorderPhase(p) === "open" ? <p className="text-sm font-semibold text-[#A97A0B]">🕒 {t("Pre-order")}: {windowText(p)}</p>
                    : <p role="alert" className="text-sm font-semibold text-red-600">{preorderPhase(p) === "upcoming" ? t("Pre-order opens on {d}. Please remove it for now.", { d: dayShort(p.preorderStart!) }) : t("Pre-order closed on {d}. Please remove it.", { d: dayShort(p.preorderEnd!) })}</p>)}
                  {!out && !over && stock <= 5 && <p className="text-sm font-semibold text-amber-600">{t("Only {n} left", { n: stock })}</p>}

                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full border border-sky-border bg-[#E6EEFF] p-1">
                      <button type="button" aria-label={t("Decrease {name}", { name: p.name })} onClick={() => setQty(l.id, l.qty - 1, l.opt)} className={iconBtn}>−</button>
                      <span aria-live="polite" className="min-w-8 text-center font-bold">{l.qty}</span>
                      <button type="button" aria-label={t("Increase {name}", { name: p.name })} disabled={atMax} onClick={() => setQty(l.id, l.qty + 1, l.opt)} className={iconBtn}>+</button>
                    </div>
                    <button type="button" onClick={() => setQty(l.id, 0, l.opt)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-mute hover:bg-white hover:text-[#E0456B]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" /></svg>
                      {t("Remove")}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside aria-label={t("Order summary")} className="space-y-4 rounded-3xl border border-white bg-white/90 p-5 shadow-soft lg:sticky lg:top-24">
          <h2 className={cardTitle}>{t("Order summary")}</h2>
          <MemberPanel billCents={Math.round((subtotal - autoOff) * 100)} />
          <div className="border-t border-sky-border pt-3"><div className="flex items-center justify-between"><p className="font-display text-lg font-extrabold text-[#2B1A8F]">{t("Order Breakdown")}</p><span className="text-xs text-mute">{count} {t("items")}</span></div>
            <SecHead>1. {t("Subtotal")}</SecHead>
            <Line label={t("Product Subtotal")} value={money(subtotal)} cls="font-bold" />
            {saved > 0 && <Line label={t("You save")} value={`−${money(saved)}`} cls="text-green-700" />}
            {memTier && mem.freeShipping && !freeAll && <Line label={t("{name} member: Free delivery", { name: memTier.name })} value={t("FREE")} cls="text-green-700" />}
            {gifts.map((g) => <Line key={g.campaignId} label={`🎁 ${g.name} × ${g.qty}`} value={t("FREE")} cls="text-green-700" />)}
            <Line label={t("Delivery")} value={freeAll || mem.freeShipping ? t("FREE") : freePP ? t("FREE in Phnom Penh") : t("We'll work it out at checkout")} cls={`text-mute ${freePP || mem.freeShipping ? "text-green-700" : ""}`} />
            <SecHead>2. {t("Applied loyalty discounts")}</SecHead>
            {autos.length === 0 ? <Line label={t("No loyalty discounts applied")} value="$0.00" cls="text-mute" /> : autos.map((a) => <Line key={a.id} label={a.name} value={`−${money(a.cents / 100)}`} cls="text-green-700" />)}
            {memTier && (memAll.discounts.length > 0 || memAll.freeShipping) && <p className="mt-2 rounded-xl bg-[#EEF4FF] p-2.5 text-xs font-bold text-[#5B3FC8]">{t("Your {name} member special is applied automatically. You can add a discount code at checkout on top of it.", { name: memTier.name })}</p>}
            <p className="mt-3 flex items-baseline justify-between border-t border-sky-border pt-3"><span className="font-extrabold text-[#2B1A8F]">{t("Total due")}</span><span className="text-2xl font-extrabold text-[#2B1A8F]">{money(subtotal - autoOff)}</span></p>
            <PointsBox goodsCents={Math.round((subtotal - autoOff) * 100)} /></div>
          {hasPre && <p className="rounded-xl bg-[#FFF6D8] p-3 text-xs">{t("Your cart has a pre-order toy: you pay a {n}% deposit at checkout (or the full price if you prefer) and the rest when it is dispatched ({when}).", { n: promotions.preorder.depositPercent, when: promotions.preorder.dispatchText })}</p>}
          <p className="text-xs text-mute">{t("Just a preview for now. We add delivery and your discount code at checkout.")}</p>

          {blocked
            ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{t("Almost there! Please fix the items marked above, then you can check out.")}</p>
            : <Link to="/checkout" className={bigBtn}>{user ? <>{t("Checkout")} · {money(subtotal - autoOff)} <span aria-hidden="true">→</span></> : t("Sign in to finish your order")}</Link>}
          <Link to="/shop" className="block text-center text-sm font-semibold text-mute hover:text-ink hover:underline">{t("← Continue shopping")}</Link>

          {telegram && (
            <a href={telegram} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-2xl bg-[#E6EEFF] px-4 py-3 text-sm font-semibold text-[#2B3FA8] hover:bg-[#D5E3FF]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></svg>
              {t("Questions? We are happy to help, chat with us")}
            </a>
          )}
        </aside>
      </div>
    </div>
  );
}
