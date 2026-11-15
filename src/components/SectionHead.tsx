import type { ReactNode } from "react";
const Star = () => <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 drop-shadow-sm"><path d="M12 2.500l2.900 5.900 6.500.9-4.700 4.600 1.100 6.400L12 17.200l-5.800 3.100 1.100-6.400L2.600 9.300l6.500-.9z" fill="#FFCF3F" stroke="#FFB800" strokeWidth="1.400" strokeLinejoin="round" /></svg>;
/** Section title in the shop style: yellow star, big rounded blue title, small subtitle, and an optional button / chips on the right. */
export default function SectionHead({ title, sub, right, as: H = "h2", className = "" }: { title: string; sub?: string; right?: ReactNode; as?: "h1" | "h2"; className?: string }) {
  return (<div className={`mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 ${className}`}>
    <div className="flex items-center gap-3"><Star /><div><H className="font-display text-2xl font-bold leading-tight text-[#1F3F8F] sm:text-[1.7rem]">{title}</H>{sub && <p className="text-xs text-[#4A6FA5] sm:text-sm">{sub}</p>}</div></div>
    {right}
  </div>);
}
