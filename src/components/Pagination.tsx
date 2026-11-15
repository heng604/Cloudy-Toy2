import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
/** Numbers to show: first, last, and two either side of the current page, with … for gaps. */
const windowOf = (page: number, pages: number): (number | "gap")[] => {
  const keep = new Set([1, pages, page - 2, page - 1, page, page + 1, page + 2].filter((n) => n >= 1 && n <= pages));
  const out: (number | "gap")[] = []; let last = 0;
  for (const n of [...keep].sort((a, b) => a - b)) { if (n - last > 1) out.push("gap"); out.push(n); last = n; }
  return out;
};
const base = "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-extrabold transition";
const off = "bg-white/60 text-[#9DB4D3] pointer-events-none";
const on = "bg-white text-[#1F4E9C] shadow-soft hover:-translate-y-0.5 hover:bg-[#E3F0FF]";
/** Page buttons under a product grid: back to first page, Back, page numbers, Next. `to(n)` builds the link for page n. */
export default function Pagination({ page, pages, to }: { page: number; pages: number; to: (n: number) => string }) {
  const { t } = useI18n();
  if (pages <= 1) return null;
  return (<nav aria-label={t("Pages")} className="mt-8 flex flex-wrap items-center justify-center gap-2">
    <Link to={to(1)} aria-disabled={page === 1} tabIndex={page === 1 ? -1 : 0} className={`${base} ${page === 1 ? off : on}`}>« {t("First page")}</Link>
    <Link to={to(page - 1)} aria-disabled={page === 1} tabIndex={page === 1 ? -1 : 0} className={`${base} ${page === 1 ? off : on}`}>‹ {t("Back")}</Link>
    {windowOf(page, pages).map((n, i) => n === "gap" ? <span key={`g${i}`} aria-hidden="true" className="px-1 text-[#4A6FA5]">…</span>
      : <Link key={n} to={to(n)} aria-current={n === page ? "page" : undefined} aria-label={`${t("Page")} ${n}`} className={`${base} ${n === page ? "bg-gradient-to-b from-[#5BAEF5] to-[#3D86E0] text-white shadow-soft" : on}`}>{n}</Link>)}
    <Link to={to(page + 1)} aria-disabled={page === pages} tabIndex={page === pages ? -1 : 0} className={`${base} ${page === pages ? off : on}`}>{t("Next")} ›</Link>
  </nav>);
}
