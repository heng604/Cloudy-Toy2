import type { Settings } from "@shared/types";
/** Size multiplier (0.5 to 2.5) the admin picked with a size slider in Admin > Settings. 1 = normal. ids: logo, home-banner, products-banner, offer-full, offer-hero, offer-mascot, offer-footer, offer-detail. */
export const sizeOf = (s: Pick<Settings, "imageSizes" | "offerMascotScale">, id: string): number => {
  const raw = s.imageSizes?.[id] ?? (id === "offer-mascot" ? s.offerMascotScale : 100); const n = Number(raw);
  return Math.min(2.5, Math.max(0.5, (Number.isFinite(n) ? n : 100) / 100));
};
