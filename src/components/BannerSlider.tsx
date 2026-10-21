import { useEffect, useState } from "react";
/** Home-page banner: changes image every 2 seconds (fade). Pauses while the mouse is over it. One image = no animation. */
export default function BannerSlider({ images = [] }: { images?: string[] }) {
  const [i, setI] = useState(0); const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (images.length < 2 || paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % images.length), 2000);
    return () => clearInterval(t);
  }, [images.length, paused]);
  if (images.length === 0) return null;
  return (<section aria-label="Promotions" className="relative mt-8 overflow-hidden rounded-xl2 border border-sky-border bg-sky-pale shadow-soft" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
    <div className="relative aspect-[16/9] w-full sm:aspect-[2/1] lg:aspect-[8/3]">
      {images.map((src, n) => (<img key={src} src={src} alt={`Banner ${n + 1}`} loading={n === 0 ? "eager" : "lazy"} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${n === i ? "opacity-100" : "opacity-0"}`} aria-hidden={n !== i} />))}
    </div>
    {images.length > 1 && <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">{images.map((_, n) => (
      <button key={n} type="button" aria-label={`Show banner ${n + 1}`} onClick={() => setI(n)} className={`h-2.5 w-2.5 rounded-full border border-white ${n === i ? "bg-white" : "bg-white/40"}`} />))}</div>}
  </section>);
}
