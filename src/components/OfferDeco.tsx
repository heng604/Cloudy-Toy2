import { useEffect, useState } from "react";
import ScaledBanner from "@/components/ScaledBanner";
import { sizeOf } from "@/lib/imageSize";
import { Link } from "react-router-dom";
import { useSettings } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
export const HAND = "font-['Caveat']";
/** Little cloud mascot (drawn here so the page works with no extra files). Put your own picture at public/img/offer-mascot.png and it is used instead. */
export function Mascot({ className = "", src }: { className?: string; src?: string }) {
  const [custom, setCustom] = useState(true);
  if (src) return <img src={src} alt="" className={className} />; // the picture the admin uploaded
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
/** Puffy cloud (two layers so the soft rim has no seams). */
export const Cloud = ({ className = "" }: { className?: string }) => (<svg viewBox="0 0 420 160" className={`pointer-events-none absolute ${className}`} aria-hidden="true"><g fill="#D3E6F9" stroke="#D3E6F9" strokeWidth="10" strokeLinejoin="round"><circle cx="62" cy="108" r="44" /><circle cx="140" cy="82" r="58" /><circle cx="232" cy="70" r="66" /><circle cx="326" cy="98" r="50" /><rect x="18" y="104" width="384" height="56" rx="28" /></g><g fill="#fff"><circle cx="62" cy="108" r="44" /><circle cx="140" cy="82" r="58" /><circle cx="232" cy="70" r="66" /><circle cx="326" cy="98" r="50" /><rect x="18" y="104" width="384" height="56" rx="28" /></g></svg>);
export const Star = ({ className = "", color = "#FFD84D" }: { className?: string; color?: string }) => (<svg viewBox="0 0 48 48" className={`pointer-events-none absolute drop-shadow ${className}`} aria-hidden="true"><path d="M24 5l5.200 12.400 13.300 1.100-10.100 8.700 3.100 13-11.500-7-11.500 7 3.100-13L5.500 18.500l13.300-1.100z" fill={color} stroke={color} strokeWidth="5" strokeLinejoin="round" /></svg>);
export const Heart = ({ className = "", color = "#FF8FB8" }: { className?: string; color?: string }) => (<svg viewBox="0 0 24 24" className={`pointer-events-none absolute drop-shadow ${className}`} aria-hidden="true"><path d="M20.800 5.600a5.200 5.200 0 0 0-7.400 0L12 7l-1.400-1.400a5.200 5.200 0 0 0-7.400 7.400L12 21.800l8.800-8.800a5.200 5.200 0 0 0 0-7.400z" fill={color} /></svg>);
export const Spark = ({ className = "", color = "#fff" }: { className?: string; color?: string }) => (<svg viewBox="0 0 24 24" className={`pointer-events-none absolute ${className}`} aria-hidden="true"><path d="M12 1l2.600 8.400L23 12l-8.400 2.600L12 23l-2.600-8.400L1 12l8.400-2.600z" fill={color} opacity=".9" /></svg>);
/** Banner background: ONLY the picture the admin uploaded (Admin > Settings). With no picture there is no background at all. */
export function BannerBg({ src }: { src?: string }) {
  return src ? <img src={src} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover" /> : null;
}
/** The live discount: "UP TO 29% OFF", "BUY 2 GET 1 FREE", "FREE GIFT" ... Text only, no card or cloud behind it (white outline keeps it readable on any picture). */
export function CloudBadge({ top, big, bottom, lg = false }: { top?: string; big: string; bottom?: string; lg?: boolean }) {
  // lg = the large version used on top of the banner picture (fills the picture's cloud); the small one is for the no-picture layout
  const line = lg ? "[paint-order:stroke_fill] [-webkit-text-stroke:7px_#fff]" : "[paint-order:stroke_fill] [-webkit-text-stroke:5px_#fff]";
  const small = big.length > 6;
  const bigCls = lg ? (small ? "text-[3.25rem]" : "text-[7rem]") : (small ? "text-4xl sm:text-5xl" : "text-6xl sm:text-7xl");
  return (<div className={`mx-auto flex w-full flex-col items-center justify-center text-center ${lg ? "max-w-[20rem]" : "max-w-[14rem]"}`} role="img" aria-label={[top, big, bottom].filter(Boolean).join(" ")}>
    {top && <p className={`font-black text-[#1F4E9C] ${lg ? "text-[1.9rem] leading-none" : "text-base"} ${line}`}>{top}</p>}<p className={`font-black leading-none text-[#FF3D83] [paint-order:stroke_fill] ${lg ? "[-webkit-text-stroke:12px_#fff] my-1" : "[-webkit-text-stroke:8px_#fff]"} ${bigCls}`}>{big}</p>{bottom && <p className={`font-black text-[#1F4E9C] ${lg ? "text-[1.9rem] leading-none" : "text-base"} ${line}`}>{bottom}</p>}</div>);
}
export const endOf = (d?: string) => (d ? new Date(`${d}T23:59:59+07:00`).getTime() : 0); // offers end at the end of their last day, shop time (Cambodia)
export function Countdown({ end, t, lg = false }: { end: number; t: (s: string) => string; lg?: boolean }) {
  const [now, setNow] = useState(Date.now()); useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const ms = Math.max(0, end - now), s = Math.floor(ms / 1000); const parts: [number, string][] = [[Math.floor(s / 86400), "Days"], [Math.floor((s % 86400) / 3600), "Hours"], [Math.floor((s % 3600) / 60), "Min"], [s % 60, "Sec"]];
  return (<div><p className={`mx-auto flex w-fit items-center justify-center font-extrabold text-[#1F4E9C] [paint-order:stroke_fill] ${lg ? "gap-3 px-3 py-1 text-[1.9rem] leading-none [-webkit-text-stroke:7px_#fff]" : "gap-2 px-3 py-1 text-xl [-webkit-text-stroke:5px_#fff]"}`}><svg width={lg ? 30 : 22} height={lg ? 30 : 22} viewBox="0 0 24 24" fill="none" stroke="#FF5C93" strokeWidth="2.400" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.500 2M9 2h6" /></svg>{t("Limited Time Only!")}</p>
    <div className={`grid grid-cols-[repeat(4,minmax(0,1fr))] ${lg ? "mt-3 gap-3" : "mt-2 gap-2"}`} role="timer" aria-label={t("Limited Time Only!")}>{parts.map(([n, l]) => <div key={l} className={`border-[#FFD3E3] bg-white text-center shadow-soft ${lg ? "rounded-2xl border-[3px] px-1 py-3" : "rounded-xl border-2 px-1 py-2"}`}><p className={`font-extrabold leading-none text-[#1F4E9C] ${lg ? "text-[3.25rem]" : "text-3xl"}`}>{String(n).padStart(2, "0")}</p><p className={`font-bold text-[#4A6FA5] ${lg ? "mt-1.5 text-xl" : "mt-1 text-sm"}`}>{t(l)}</p></div>)}</div></div>);
}
/** The pink-and-lilac "Shop now and enjoy special savings!" banner (picture and mascot can be changed in admin). */
export function HappyBanner() {
  const { t } = useI18n(); const { settings } = useSettings(); const footerImg = settings.offerFooterImage || "", mascotImg = settings.offerMascotImage || ""; const kb = sizeOf(settings, "offer-footer");
  const btn = "font-['Caveat'] rounded-full bg-[#FF7BA9] font-bold text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-[#F2679A]";
  // the admin's own picture (Admin > Settings > Bottom banner) IS the banner; only the Happy Shopping button stays on top (can be switched off)
  if (footerImg) return (<section aria-label={t("Happy Shopping")} className="relative w-full overflow-hidden"><ScaledBanner src={footerImg} k={kb} />
    {settings.offerFooterButton !== false && <div className="absolute inset-y-0 right-[3%] flex items-center"><Link to="/shop" className={`${btn} px-4 py-1.5 text-lg sm:px-8 sm:py-2.5 sm:text-2xl`}>{t("Happy Shopping")} ♡</Link></div>}</section>);
  return (<section style={{ paddingBlock: `${1.25 * kb}rem` }} className="relative flex flex-wrap items-center justify-center gap-4 overflow-hidden px-5 sm:justify-between sm:px-10 lg:px-16">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-r from-[#D9E8FF] via-[#E6E2FF] to-[#FFDDEA]"><Cloud className="-bottom-10 -left-10 w-[22rem] opacity-90" /><Cloud className="-bottom-12 -right-10 w-[26rem] opacity-90" /><Star className="left-[30%] top-2 w-7" /><Star className="right-[26%] top-3 w-6" color="#FFE58A" /><Heart className="bottom-3 left-[58%] w-5" color="#B7A6F5" /></div>
    <Mascot src={mascotImg} className="relative hidden h-16 w-auto sm:block" /><p className={`${HAND} relative text-center text-2xl font-bold text-[#1F4E9C] sm:text-3xl`}>{t("Shop now and enjoy special savings!")} <span aria-hidden="true" className="text-[#8E7CF0]">♡</span></p>
    <Link to="/shop" className={`${btn} relative px-8 py-2.5 text-2xl`}>{t("Happy Shopping")} ♡</Link></section>);
}
