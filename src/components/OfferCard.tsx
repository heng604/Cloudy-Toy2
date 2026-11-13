import { Link } from "react-router-dom";
import { dayShort, type Product } from "@shared/products";
import { campaignDetail, campaignLabel, liveCampaigns, liveFestivals, festivalName, festivalText, festivalDetail, type Campaign, type Promotions } from "@shared/promotions";

/** One special offer, ready to draw as a big pastel card (pink BOGO, purple festival, blue spend, green shipping ...). */
export type Offer = { id: string; tone: Tone; badge: string; title: string; text: string; validity: string; image?: string; more?: string; to: string };
type Tone = "pink" | "purple" | "blue" | "green";
const TONES: Record<Tone, { bg: string; badge: string; title: string; btn: string; deco: string; date: string }> = {
  pink: { bg: "from-[#FFE4EE] via-[#FFEFF5] to-[#FFF8FB] border-[#FFD3E3]", badge: "bg-[#FF6F9F] text-white", title: "text-[#C2305F]", btn: "bg-[#FF5C93] hover:bg-[#F0447F]", deco: "text-[#FF9DBD]", date: "text-[#D9467A]" },
  purple: { bg: "from-[#EBDDFF] via-[#F2EAFF] to-[#F9F5FF] border-[#DCC8FF]", badge: "bg-[#8B4FE0] text-white", title: "text-[#4B2A99]", btn: "bg-[#7A3FD8] hover:bg-[#6930C4]", deco: "text-[#B99AF0]", date: "text-[#7A3FD8]" },
  blue: { bg: "from-[#DCEBFF] via-[#EAF3FF] to-[#F5F9FF] border-[#C6DDFB]", badge: "bg-[#4B86E0] text-white", title: "text-[#1F4E9C]", btn: "bg-[#4A86D8] hover:bg-[#3A74C6]", deco: "text-[#9DC1F2]", date: "text-[#3A74C6]" },
  green: { bg: "from-[#D9F5E6] via-[#E8F9F0] to-[#F4FCF8] border-[#BDEBD2]", badge: "bg-[#2FA56A] text-white", title: "text-[#1E7A4C]", btn: "bg-[#2FA56A] hover:bg-[#238A56]", deco: "text-[#8ED9B2]", date: "text-[#238A56]" },
};
const Icon = ({ d, size = 14 }: { d: string; size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const GIFT = "M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.500a2.500 2.500 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.500a2.500 2.500 0 0 0 0-5C13 2 12 7 12 7z";
const TAG = "M20.600 13.400 13.400 20.600a2 2 0 0 1-2.800 0L2 12V2h10l8.600 8.600a2 2 0 0 1 0 2.800zM7 7h.01";
const CAL = "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z";
const TRUCK = "M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.500 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18.500 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z";

export default function OfferCard({ o, t, label, onClick, open }: { o: Offer; t: (s: string) => string; label?: string; onClick?: () => void; open?: boolean }) {
  const c = TONES[o.tone]; const icon = o.tone === "pink" ? GIFT : o.tone === "green" ? TRUCK : TAG;
  const btn = `mt-4 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${c.btn}`; const text = `${label ?? t("View Details")} →`;
  return (<article className={`relative flex min-h-[13rem] overflow-hidden rounded-3xl border bg-gradient-to-r p-5 shadow-soft sm:p-6 ${c.bg}`}>
    <span aria-hidden="true" className={`pointer-events-none absolute left-[46%] top-4 text-xl ${c.deco}`}>♥</span><span aria-hidden="true" className={`pointer-events-none absolute bottom-5 left-[40%] text-sm ${c.deco}`}>♥</span><span aria-hidden="true" className={`pointer-events-none absolute right-5 top-4 text-lg ${c.deco}`}>✦</span>
    <div className="relative z-10 flex min-w-0 flex-1 flex-col items-start">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${c.badge}`}><Icon d={icon} />{o.badge}</span>
      <h3 className={`mt-3 text-2xl font-extrabold leading-tight sm:text-3xl ${c.title}`}>{o.title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink/80">{o.text}</p>
      <p className={`mt-3 inline-flex items-center gap-1.5 text-sm font-bold ${c.date}`}><Icon d={CAL} size={16} />{o.validity}</p>
      {open && o.more && <p className="mt-2 whitespace-pre-line rounded-xl bg-white/70 p-3 text-xs">{o.more}</p>}
      <div className="flex-1" />
      {onClick ? <button type="button" aria-expanded={open} onClick={onClick} className={btn}>{text}</button> : <Link to={o.to} className={btn}>{text}</Link>}</div>
    <div className="relative z-0 -mr-2 flex w-28 shrink-0 items-center justify-center sm:w-44 md:w-52">
      {o.image ? <img src={o.image} alt="" loading="lazy" decoding="async" className="max-h-44 w-full rotate-3 rounded-2xl object-cover shadow-lift ring-4 ring-white/80 sm:max-h-48" /> : <img src="/img/sidebar-mascot.png" alt="" loading="lazy" decoding="async" className="max-h-44 w-full object-contain" />}</div>
  </article>);
}

/** Every live promotion rule and festival as a card. `nameOf` turns a product id into its name. */
export function buildOffers(promotions: Promotions, all: Product[], lang: string, t: (s: string) => string): Offer[] {
  const byId = new Map(all.map((p) => [p.id, p])); const img = (id?: string) => (id ? byId.get(id)?.images?.[0]?.src : undefined); const nameOf = (id: string) => byId.get(id)?.name ?? t("the free gift");
  const valid = (a?: string, b?: string) => (a && b ? `${dayShort(a)} – ${dayShort(b)}` : t("Always active"));
  const fests = liveFestivals(promotions.festivals); const many = fests.length > 1;
  const rules = liveCampaigns(promotions.campaigns).map((c: Campaign): Offer => {
    const k = c.kind; const tone: Tone = k === "bogo" || k === "spend_gift" ? "pink" : k === "free_shipping" ? "green" : k.startsWith("spend") ? "blue" : "purple";
    const picture = k === "bogo" || k === "spend_gift" ? img(c.bonusProductId) : k.startsWith("product") ? img(c.productIds?.[0]) : k.startsWith("category") ? all.find((p) => p.category.trim().toLowerCase() === c.category.trim().toLowerCase())?.images?.[0]?.src : undefined;
    return { id: c.id, tone, badge: t(campaignLabel(c)), title: c.name, text: campaignDetail(c, nameOf), validity: valid(c.startDate, c.endDate), image: picture, more: `${campaignDetail(c, nameOf)}.\n${t("Applied automatically at checkout.")}`, to: "/shop?sale=1" };
  });
  const festivals = fests.map((f): Offer => ({ id: `f-${f.id}`, tone: "purple", badge: f.percent > 0 ? `${f.percent}% OFF` : t("Festival"), title: festivalName(f, lang), text: festivalText(f, lang) || festivalDetail(f), validity: valid(f.startDate, f.endDate), image: img(f.productIds[0]), more: `${festivalDetail(f)}${f.code ? `\n${t("Code")}: ${f.code}` : ""}`, to: many ? `/shop?sale=1&festival=${f.id}` : "/shop?sale=1" }));
  return [...rules, ...festivals];
}
