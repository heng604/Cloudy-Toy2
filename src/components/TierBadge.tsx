import type { Tier } from "@shared/membership";
/** A level's picture if the admin uploaded one, otherwise its emoji. */
export default function TierBadge({ tier, size = 48, className = "" }: { tier: Pick<Tier, "emoji" | "image"> | null; size?: number; className?: string }) {
  const px = { width: size, height: size };
  return (<span aria-hidden="true" style={px} className={`grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-sky-pale ${className}`}>
    {tier?.image ? <img src={tier.image} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span style={{ fontSize: size * 0.5 }}>{tier?.emoji || "☁️"}</span>}</span>);
}
