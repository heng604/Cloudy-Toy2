import { useEffect } from "react";
/** Same title template as before: "Page | Cloudy-Toy". Admin pages ask search engines not to index them. */
export function useTitle(title?: string, noindex = false) {
  useEffect(() => {
    document.title = title ? `${title} | Cloudy-Toy` : "Cloudy-Toy";
    // each page names its own address as the preferred one (no query string), so shared / filtered links do not count as copies
    let c = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null; if (!c) { c = document.createElement("link"); c.rel = "canonical"; document.head.appendChild(c); } c.href = location.origin + location.pathname;
    let m = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (noindex) { if (!m) { m = document.createElement("meta"); m.name = "robots"; document.head.appendChild(m); } m.content = "noindex"; } else m?.remove();
  }, [title, noindex]);
}
