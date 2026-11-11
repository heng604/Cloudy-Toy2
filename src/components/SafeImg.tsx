import { useState, type ImgHTMLAttributes } from "react";
import { FALLBACK_IMG } from "@shared/products";
/** <img> that retries ONCE (cache-busted) if the picture fails to load, then shows the placeholder instead of a broken-image icon. */
export default function SafeImg({ src, ...rest }: ImgHTMLAttributes<HTMLImageElement> & { src: string }) {
  const [tries, setTries] = useState(0);
  const url = tries === 0 ? src : tries === 1 ? `${src}${src.includes("?") ? "&" : "?"}r=${Date.now()}` : FALLBACK_IMG;
  return <img {...rest} src={url} onError={() => setTries((n) => (n < 2 ? n + 1 : n))} />;
}
