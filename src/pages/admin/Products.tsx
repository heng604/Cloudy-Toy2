import { useI18n } from "@/lib/i18n";
import { Link, useSearchParams } from "react-router-dom";
import { stockStatus, type Product } from "@shared/products";
import ExportButtons from "@/components/admin/ExportButtons";
import DeleteButton from "@/components/admin/DeleteButton";
import Skeleton from "@/components/Skeleton";
import { getSubmit } from "@/lib/forms";
import { api, post } from "@/lib/api";
import { useTitle } from "@/lib/title";
import { useAdmin, refreshAdmin, Msg } from "./hooks";
const badge = { OUT: "bg-red-100 text-red-800", LOW: "bg-amber-100 text-amber-800", OK: "bg-green-100 text-green-800" } as const;
export default function AdminProducts() {
  const { t } = useI18n(); useTitle(t("Products"), true);
  const [sp, setSp] = useSearchParams(); const { data } = useAdmin<{ products: Product[] }>("/admin/products");
  if (!data) return <Skeleton />;
  const q = (sp.get("q") ?? "").toLowerCase(), show = sp.get("show") ?? "all";
  const list = data.products.filter((p) => `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(q) && (show === "all" || (show === "low" && stockStatus(p.stock) !== "OK") || (show === "hidden" && p.active === false)));
  const cls = "rounded-full border border-sky-border bg-white px-4 py-2";
  const setStockFor = (id: string) => async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); await post(`/admin/products/${id}/stock`, { stock: Number(new FormData(e.currentTarget).get("stock")) }); refreshAdmin(); setSp({ saved: "1" }); };
  const del = (id: string) => async () => { await api(`/admin/products/${id}`, { method: "DELETE" }); refreshAdmin(); setSp({ deleted: "1" }); };
  return (<div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-extrabold sm:text-3xl">{t("Products")}</h1>
      <div className="flex flex-wrap gap-2"><ExportButtons type="products" /><Link to="/admin/products/new" className="rounded-full bg-sky px-5 py-2 font-bold hover:bg-sky-hover">{t("+ New product")}</Link></div></div>
    <Msg ok={sp.get("saved") ? "Saved" : sp.get("deleted") ? "Product deleted" : null} />
    <form key={sp.toString()} onSubmit={getSubmit(setSp)} className="flex flex-wrap gap-2"><input name="q" defaultValue={sp.get("q") ?? ""} placeholder="Search name, SKU, category" aria-label="Search products" className={`${cls} min-w-60 flex-1`} />
      <select name="show" defaultValue={show} className={cls} aria-label="Show"><option value="all">All</option><option value="low">Low or out of stock</option><option value="hidden">Hidden</option></select><button className="rounded-full bg-sky px-5 py-2 font-bold">{t("Filter")}</button></form>
    <div className="overflow-x-auto rounded-xl2 border border-sky-border bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-sky-pale"><tr>{["", "Product", "SKU", "Category", "Price", "Stock", ""].map((h, i) => <th key={i} className="p-3">{h === "SKU" ? h : t(h)}</th>)}</tr></thead>
      <tbody>{list.map((p) => { const st = stockStatus(p.stock); return (<tr key={p.id} className="border-t border-sky-border">
        <td className="p-3">{p.images[0] ? <img loading="lazy" src={p.images[0].src} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-lg bg-sky-pale">☁️</span>}</td>
        <td className="p-3 font-semibold">{p.name}{p.active === false && <span className="ml-2 rounded-full bg-slate-200 px-2 text-xs">hidden</span>}</td><td className="p-3">{p.sku}</td><td className="p-3">{p.category}</td>
        <td className="p-3">{p.salePrice != null ? <><b>${p.salePrice.toFixed(2)}</b> <s className="text-mute">${p.price.toFixed(2)}</s></> : `$${p.price.toFixed(2)}`}</td>
        <td className="p-3"><form key={p.stock} onSubmit={setStockFor(p.id)} className="flex items-center gap-2"><input name="stock" type="number" min="0" step="1" defaultValue={p.stock} aria-label={`Stock for ${p.name}`} className="w-20 rounded-lg border border-sky-border px-2 py-1" /><button className="rounded-full border border-sky-border px-3 py-1 text-xs font-bold hover:bg-sky-pale">Set</button><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badge[st]}`}>{st}</span></form></td>
        <td className="p-3"><div className="flex items-center justify-end gap-2"><Link to={`/admin/products/${p.id}`} className="rounded-full bg-sky px-4 py-1.5 font-bold hover:bg-sky-hover">{t("Edit")}</Link><DeleteButton action={del(p.id)} message={`Delete "${p.name}" permanently? This cannot be undone.`} /></div></td></tr>); })}</tbody></table>
      {list.length === 0 && <p className="p-6 text-center text-mute">No products match.</p>}</div></div>);
}
