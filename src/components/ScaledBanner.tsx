import { useState } from "react";
/** Full-width banner picture whose height follows the admin's size slider: 100% shows the whole picture, more makes the banner taller, less makes it shorter (the picture is trimmed top and bottom, never stretched). */
export default function ScaledBanner({ src, k, className = "", fetchPriority }: { src: string; k: number; className?: string; fetchPriority?: "high" | "low" | "auto" }) {
  const [r, setR] = useState(4);
  return (<div className={`relative w-full overflow-hidden ${className}`} style={{ aspectRatio: String(r / k) }}>
    <img src={src} alt="" fetchPriority={fetchPriority} onLoad={(e) => { const i = e.currentTarget; if (i.naturalHeight) setR(i.naturalWidth / i.naturalHeight); }} className="absolute inset-0 h-full w-full object-cover object-center" /></div>);
}
