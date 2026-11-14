import { useEffect, useState } from "react";
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
/** The dreamy sky behind the default banner: soft gradient, cloud banks, puffy stars, hearts and sparkles. */
export function SkyBackdrop() {
  return (<div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-b from-[#B9DAFB] via-[#D4E8FF] to-[#EAF4FF]">
    <Cloud className="-left-24 -top-6 w-[22rem] opacity-80 sm:w-[28rem]" /><Cloud className="right-[16%] -top-10 hidden w-80 opacity-70 md:block" /><Cloud className="-right-24 top-2 w-[22rem] opacity-80 sm:w-[26rem]" />
    <Cloud className="-bottom-10 -left-20 w-[30rem] sm:w-[40rem]" /><Cloud className="-bottom-14 left-[30%] hidden w-[40rem] md:block" /><Cloud className="-bottom-12 -right-16 w-[30rem] sm:w-[42rem]" />
    <Star className="left-3 top-4 w-10 sm:w-14" /><Star className="left-[36%] top-[62%] w-9 sm:w-12" /><Star className="left-[12%] top-[58%] hidden w-7 sm:block" color="#8EC5FF" /><Star className="right-[6%] top-5 w-10 sm:w-14" /><Star className="left-[52%] top-3 hidden w-8 sm:block" color="#FFE58A" />
    <Heart className="left-[58%] top-6 hidden w-9 sm:block" /><Heart className="right-[30%] bottom-[28%] hidden w-6 md:block" color="#FFB3CF" />
    <Spark className="left-[28%] top-3 w-4" /><Spark className="left-[47%] top-[26%] hidden w-3 sm:block" /><Spark className="right-[24%] top-4 w-4" /><Spark className="right-[4%] top-[48%] hidden w-5 sm:block" /><Spark className="left-[5%] top-[40%] hidden w-4 sm:block" color="#FFE58A" />
    <i className="absolute left-[41%] top-6 hidden h-1 w-6 -rotate-[30deg] rounded-full bg-[#FFC93C] sm:block" /><i className="absolute left-[41.500%] top-10 hidden h-1 w-6 rounded-full bg-[#FFC93C] sm:block" /><i className="absolute left-[41%] top-14 hidden h-1 w-6 rotate-[30deg] rounded-full bg-[#FFC93C] sm:block" /></div>);
}
/** The white cloud badge: "UP TO 29% OFF", "BUY 2 GET 1 FREE", "FREE GIFT" ... */
export function CloudBadge({ top, big, bottom }: { top?: string; big: string; bottom?: string }) {
  return (<div className="relative mx-auto h-36 w-52 sm:h-40 sm:w-56" role="img" aria-label={[top, big, bottom].filter(Boolean).join(" ")}>
    <svg viewBox="0 0 220 170" className="absolute inset-0 h-full w-full drop-shadow-lg" aria-hidden="true"><g fill="#DCEBFA" stroke="#DCEBFA" strokeWidth="8" strokeLinejoin="round"><circle cx="58" cy="104" r="42" /><circle cx="108" cy="72" r="54" /><circle cx="162" cy="100" r="46" /><rect x="22" y="98" width="176" height="56" rx="28" /></g><g fill="#fff"><circle cx="58" cy="104" r="42" /><circle cx="108" cy="72" r="54" /><circle cx="162" cy="100" r="46" /><rect x="22" y="98" width="176" height="56" rx="28" /></g></svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-2 text-center">{top && <p className="text-sm font-black text-[#1F4E9C]">{top}</p>}<p className={`font-black leading-none text-[#FF3D83] ${big.length > 6 ? "text-3xl sm:text-4xl" : "text-5xl sm:text-6xl"}`}>{big}</p>{bottom && <p className="text-sm font-black text-[#1F4E9C]">{bottom}</p>}</div></div>);
}
export const endOf = (d?: string) => (d ? new Date(`${d}T23:59:59+07:00`).getTime() : 0); // offers end at the end of their last day, shop time (Cambodia)
export function Countdown({ end, t }: { end: number; t: (s: string) => string }) {
  const [now, setNow] = useState(Date.now()); useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const ms = Math.max(0, end - now), s = Math.floor(ms / 1000); const parts: [number, string][] = [[Math.floor(s / 86400), "Days"], [Math.floor((s % 86400) / 3600), "Hours"], [Math.floor((s % 3600) / 60), "Min"], [s % 60, "Sec"]];
  return (<div><p className="mx-auto flex w-fit items-center justify-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-sm font-extrabold text-[#1F4E9C]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF5C93" strokeWidth="2.400" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.500 2M9 2h6" /></svg>{t("Limited Time Only!")}</p>
    <div className="mt-2 grid grid-cols-4 gap-2" role="timer" aria-label={t("Limited Time Only!")}>{parts.map(([n, l]) => <div key={l} className="rounded-xl border-2 border-[#FFD3E3] bg-white px-1 py-1.5 text-center shadow-soft"><p className="text-xl font-extrabold leading-none text-[#1F4E9C] sm:text-2xl">{String(n).padStart(2, "0")}</p><p className="mt-1 text-[10px] font-bold text-mute">{t(l)}</p></div>)}</div></div>);
}
/** The pink-and-lilac "Shop now and enjoy special savings!" banner (picture and mascot can be changed in admin). */
export function HappyBanner() {
  const { t } = useI18n(); const { settings } = useSettings(); const footerImg = settings.offerFooterImage || "", mascotImg = settings.offerMascotImage || "";
  return (<section className="relative flex flex-wrap items-center justify-center gap-4 overflow-hidden px-5 py-5 sm:justify-between sm:px-10 lg:px-16">
    {footerImg ? <img src={footerImg} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" /> : <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-r from-[#D9E8FF] via-[#E6E2FF] to-[#FFDDEA]"><Cloud className="-bottom-10 -left-10 w-[22rem] opacity-90" /><Cloud className="-bottom-12 -right-10 w-[26rem] opacity-90" /><Star className="left-[30%] top-2 w-7" /><Star className="right-[26%] top-3 w-6" color="#FFE58A" /><Heart className="bottom-3 left-[58%] w-5" color="#B7A6F5" /></div>}
    <Mascot src={mascotImg} className="relative hidden h-16 w-auto sm:block" /><p className={`${HAND} relative text-center text-2xl font-bold text-[#1F4E9C] sm:text-3xl`}>{t("Shop now and enjoy special savings!")} <span aria-hidden="true" className="text-[#8E7CF0]">♡</span></p>
    <Link to="/shop" className={`${HAND} relative rounded-full bg-[#FF7BA9] px-8 py-2.5 text-2xl font-bold text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-[#F2679A]`}>{t("Happy Shopping")} ♡</Link></section>);
}
