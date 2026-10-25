import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
/** Home-page banner, full width of the screen. Shows the pictures the admin uploads (fades to the next every 2 seconds, pauses while the mouse is over it) with the
 *  "Shopping with Cloudy Toys now!" button on top of the picture. Short strip: the picture is cropped to fit. */
export default function BannerSlider({ images = [], first = false }: { images?: string[]; first?: boolean }) {
  const { t } = useI18n(); const [i, setI] = useState(0); const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (images.length < 2 || paused) return;
    const id = setInterval(() => setI((n) => (n + 1) % images.length), 2000);
    return () => clearInterval(id);
  }, [images.length, paused]);
  if (images.length === 0) return null;
  // edge to edge: break out of the page column; `first` also cancels the gap under the header
  return (<section aria-label="Promotions" className={`relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-sky-pale ${first ? "-mt-5 sm:-mt-8" : "mt-8"} mb-8`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
    <div className="relative w-full" style={{ height: "clamp(12rem, 52vw, 750px)" }}>
      {images.map((src, n) => (<img key={src} src={src} alt={`Banner ${n + 1}`} loading={n === 0 ? "eager" : "lazy"}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${n === i ? "opacity-100" : "opacity-0"}`} aria-hidden={n !== i} />))}
      <Link to="/shop" className="absolute bottom-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#5BAAF0] px-5 py-2 text-xs font-extrabold text-white shadow-lift transition hover:-translate-y-[calc(0.125rem)] hover:bg-[#4A99E0] sm:bottom-8 sm:text-sm md:left-[18%] md:translate-x-0 md:px-7 md:py-3 md:text-base lg:bottom-[10%]"><span aria-hidden="true">♥</span>{t("Shopping with Cloudy Toys now!")}</Link>
    </div>
    {images.length > 1 && <div className="absolute bottom-2 right-4 flex gap-2">{images.map((_, n) => (
      <button key={n} type="button" aria-label={`Show banner ${n + 1}`} onClick={() => setI(n)} className={`h-2.5 w-2.5 rounded-full border border-white ${n === i ? "bg-white" : "bg-white/40"}`} />))}</div>}
  </section>);
}
